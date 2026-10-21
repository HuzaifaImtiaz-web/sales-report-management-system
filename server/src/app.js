const path = require('path');
const express = require('express');
const config = require('./config');
const logger = require('./logger');
const { handlers, createServices } = require('./rpc/handlers');
const sessions = require('./auth/sessions');
const rateLimiter = require('./auth/rateLimiter');
const { AuthError, ForbiddenError, toHttpError } = require('./errors');
const security = require('./http/security');
const { createExportRouter } = require('./http/exportRoutes');
const { createBackupRouter } = require('./http/backupRoutes');

const CSRF_HEADER = 'x-csrf-token';
const CSRF_ERROR = 'Your security token is missing or out of date. Please reload the page and try again.';

/**
 * Per-request context handed to every RPC handler: database services, the signed-in user and
 * helpers that start or end sessions (they set the cookies on this response).
 */
function createContext(req, res, db) {
  const services = createServices(db);
  const secure = config.cookies.secure;
  const cookies = security.parseCookies(req);

  const ctx = {
    db,
    s: services,
    ip: req.ip,
    userAgent: req.get('user-agent') || null,
    cookies,
    user: null,
    session: null,
    recoverySession: null,
    // Set when this response rotates the CSRF token (new sign-in, password change).
    newCsrfToken: null,
    audit: (entry) => services.audit.logAction({
      ...entry,
      performedBy: entry.performedBy || (ctx.user ? ctx.user.username : 'System'),
      ipOrDevice: entry.ipOrDevice || (ctx.ip ? String(ctx.ip).slice(0, 64) : null)
    }),

    /** Starts a new session for `user` (the full record, including sessionVersion). */
    async signIn(user) {
      if (ctx.session) await sessions.deleteSessionByHash(db, ctx.session.idHash);
      const created = await sessions.createSession(db, { kind: 'user', user, ip: ctx.ip, userAgent: ctx.userAgent });
      security.setCookie(res, config.cookies.session, created.token, { maxAgeMs: config.session.ttlMs, secure });
      ctx.newCsrfToken = created.csrfToken;
      ctx.session = { idHash: sessions.hashToken(created.token), csrfToken: created.csrfToken, createdAt: new Date().toISOString() };
      return created;
    },

    async signOut() {
      if (ctx.session) await sessions.deleteSessionByHash(db, ctx.session.idHash);
      ctx.session = null;
      security.clearCookie(res, config.cookies.session, { secure });
    },

    async startRecovery() {
      if (ctx.recoverySession) await sessions.deleteSessionByHash(db, ctx.recoverySession.idHash);
      const created = await sessions.createSession(db, { kind: 'recovery', ip: ctx.ip, userAgent: ctx.userAgent });
      security.setCookie(res, config.cookies.recovery, created.token, { maxAgeMs: config.session.recoveryTtlMs, secure });
      return created.csrfToken;
    }
  };
  return ctx;
}

function assertCsrf(req, expected) {
  if (!sessions.safeEqual(req.get(CSRF_HEADER), expected)) {
    const err = new ForbiddenError(CSRF_ERROR);
    err.code = 'CSRF';
    throw err;
  }
}

/** Loads the signed-in user for a request (used by the RPC endpoint and the file endpoints). */
async function authenticateRequest(req, db, { csrf = true } = {}) {
  const token = security.parseCookies(req)[config.cookies.session];
  const { session, user } = await sessions.getUserSession(db, token);
  if (csrf) assertCsrf(req, session.csrfToken);
  return { session, user };
}

function sendError(res, err, label) {
  const { status, message } = toHttpError(err);
  if (status >= 500) logger.error(`${label} failed`);
  else logger.info(`${label} rejected (${status}): ${message}`);
  const body = { success: false, error: message };
  if (err && err.code === 'CSRF') body.code = 'CSRF';
  res.status(status).json(body);
}

function createRpcHandler(db) {
  return async function rpc(req, res) {
    const started = Date.now();
    const channel = req.params.channel;
    const definition = Object.prototype.hasOwnProperty.call(handlers, channel) ? handlers[channel] : null;

    if (!definition) {
      res.status(404).json({ success: false, error: 'Unknown operation.' });
      return;
    }

    const ctx = createContext(req, res, db);

    try {
      if (definition.recovery) {
        const token = ctx.cookies[config.cookies.recovery];
        ctx.recoverySession = await sessions.getRecoverySession(db, token);
        assertCsrf(req, ctx.recoverySession.csrfToken);
      } else if (!definition.public) {
        const { session, user } = await authenticateRequest(req, db);
        ctx.session = session;
        ctx.user = user;
      } else if (definition.optionalSession) {
        try {
          const { session, user } = await sessions.getUserSession(db, ctx.cookies[config.cookies.session]);
          ctx.session = session;
          ctx.user = user;
        } catch (e) {
          if (!(e instanceof AuthError)) throw e;
        }
      }

      if (definition.roles && !definition.roles.includes(ctx.user.role)) {
        throw new ForbiddenError(`Permission denied: the ${ctx.user.role} role cannot perform this action.`);
      }

      const limit = definition.rateLimit;
      const limitKey = limit ? limit.key(ctx) : null;
      if (limit) {
        if (limit.failuresOnly) await rateLimiter.check(db, limitKey, limit);
        else await rateLimiter.consume(db, limitKey, limit);
      }

      const args = req.body && Array.isArray(req.body.args) ? req.body.args : [];
      let data;
      try {
        data = await definition.handler(ctx, ...args);
      } catch (err) {
        if (limit && limit.failuresOnly) await rateLimiter.hit(db, limitKey, limit).catch(() => {});
        throw err;
      }

      if (ctx.newCsrfToken) res.setHeader('X-CSRF-Token', ctx.newCsrfToken);
      res.json({ success: true, data: data === undefined ? null : data });
      logger.debug(`${channel} by ${ctx.user ? ctx.user.username : 'guest'} in ${Date.now() - started} ms`);
    } catch (err) {
      // An expired session must also drop the cookie, so the browser stops sending it.
      if (err instanceof AuthError && !definition.recovery) {
        security.clearCookie(res, config.cookies.session, { secure: config.cookies.secure });
      }
      sendError(res, err, channel);
    }
  };
}

function serveWebApp(app, staticDir) {
  const pages = security.pageHeaders({ secure: config.cookies.secure });
  const indexFile = path.join(staticDir, 'index.html');

  app.use(pages, express.static(staticDir, {
    index: false,
    dotfiles: 'ignore',
    setHeaders(res, filePath) {
      // Vite puts a content hash in every file name under assets/, so those never change.
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));

  // The app uses hash URLs (/#/orders), so every other page request gets index.html.
  app.get(/^\/(?!api\/|health$).*/, pages, (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(indexFile);
  });
}

function createApp({ db }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  const secure = config.cookies.secure;
  const api = express.Router();
  api.use(security.apiHeaders({ secure }));
  api.use(security.requestLimiter(config.requestLimit));
  api.use(security.sameOriginOnly({ allowedOrigins: config.allowedOrigins }));
  api.use(security.requireJson);

  api.post('/rpc/:channel', express.json({ limit: config.normalBodySize, strict: true }), createRpcHandler(db));
  api.use('/export', createExportRouter({ db, authenticateRequest, sendError }));
  api.use('/backup', createBackupRouter({ db, authenticateRequest, sendError, createContext }));
  api.use((req, res) => res.status(404).json({ success: false, error: 'Not found.' }));

  // Used by hosting health checks.
  app.get('/health', security.apiHeaders({ secure }), async (req, res) => {
    try {
      await db.get('SELECT 1 AS ok');
      res.json({ status: 'ok' });
    } catch (err) {
      logger.error('Health check failed', err);
      res.status(503).json({ status: 'error' });
    }
  });

  app.use('/api', api);

  if (config.staticDir) serveWebApp(app, config.staticDir);

  app.use((req, res) => {
    security.apiHeaders({ secure })(req, res, () => {});
    res.status(404).json({ success: false, error: 'Not found.' });
  });

  // Body parser errors (invalid JSON, payload too large) and anything unexpected.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = status === 413
      ? 'The request is too large for the server.'
      : status < 500 ? 'Invalid request.' : 'An unexpected server error occurred. Please try again.';
    if (status >= 500) logger.error('Request failed', err);
    if (!res.headersSent) res.status(status).json({ success: false, error: message });
  });

  return app;
}

module.exports = { createApp, authenticateRequest };
