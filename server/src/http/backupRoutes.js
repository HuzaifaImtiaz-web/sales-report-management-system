const zlib = require('zlib');
const express = require('express');
const config = require('../config');
const SnapshotService = require('../services/SnapshotService');
const UserRepository = require('../auth/UserRepository');
const PasswordService = require('../auth/PasswordService');
const rateLimiter = require('../auth/rateLimiter');
const { AppError, ForbiddenError } = require('../errors');

// A backup holds every business record, so downloading or restoring one asks for the
// administrator's password again: a stolen browser session alone is not enough.
const REAUTH_LIMIT = { max: 10, windowMs: 15 * 60 * 1000 };
// Vercel functions cannot send or receive more than 4.5 MB; backups travel gzipped (about 10x smaller).
const MAX_DOWNLOAD_BYTES = config.isVercel ? Math.floor(4.4 * 1024 * 1024) : 500 * 1024 * 1024;

async function confirmAdminPassword(db, user, password) {
  if (user.role !== 'Admin') {
    throw new ForbiddenError('Permission denied: only administrators can download or restore backups.');
  }
  const key = `reauth:${user.id}`;
  await rateLimiter.check(db, key, REAUTH_LIMIT);
  const account = await new UserRepository(db).findById(user.id);
  const ok = typeof password === 'string' && account && await PasswordService.verifyPassword(password, account.passwordHash);
  if (!ok) {
    await rateLimiter.hit(db, key, REAUTH_LIMIT);
    throw new AppError('Incorrect password. Enter your own sign-in password to continue.', 403);
  }
}

function createBackupRouter({ db, authenticateRequest, sendError, createContext }) {
  const router = express.Router();

  /**
   * POST /api/backup/download  { password }
   * Responds with Himmel_Backup_<date>.json.gz (the same JSON the restore accepts).
   */
  router.post('/download', express.json({ limit: '10kb', strict: true }), async (req, res) => {
    try {
      const { user } = await authenticateRequest(req, db);
      await confirmAdminPassword(db, user, req.body && req.body.password);

      const snapshot = await SnapshotService.exportSnapshot(db, { createdBy: user.username });
      const gz = zlib.gzipSync(Buffer.from(JSON.stringify(snapshot), 'utf8'), { level: 9 });
      if (gz.length > MAX_DOWNLOAD_BYTES) {
        throw new AppError('The database is too large to download through the web app. Use the database host\'s own backups instead.', 413);
      }

      const ctx = createContext(req, res, db);
      ctx.user = user;
      await ctx.audit({
        module: 'Settings', entityType: 'Backup', entityId: snapshot.createdAt, action: 'Backup',
        newValue: { createdAt: snapshot.createdAt, tables: Object.keys(snapshot.tables).length, sizeBytes: gz.length }
      });

      const date = snapshot.createdAt.slice(0, 10);
      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', `attachment; filename="Himmel_Backup_${date}.json.gz"`);
      res.setHeader('Content-Length', String(gz.length));
      res.end(gz);
    } catch (err) {
      sendError(res, err, 'backup download');
    }
  });

  /**
   * POST /api/backup/restore  { password, snapshot, fileName }
   * The browser sends the JSON gzipped (Content-Encoding: gzip). The size limit applies to the
   * unzipped JSON, and the body is only read after the session has been checked.
   */
  router.post(
    '/restore',
    async (req, res, next) => {
      try {
        req.authenticated = await authenticateRequest(req, db);
        if (req.authenticated.user.role !== 'Admin') {
          throw new ForbiddenError('Permission denied: only administrators can download or restore backups.');
        }
        next();
      } catch (err) {
        sendError(res, err, 'backup restore');
      }
    },
    express.json({ limit: config.maxBodySize, strict: true, inflate: true }),
    async (req, res) => {
      try {
        const { user } = req.authenticated;
        const { password, snapshot, fileName } = req.body || {};
        await confirmAdminPassword(db, user, password);

        const counts = await SnapshotService.restoreSnapshot(db, snapshot, {
          fallbackUserId: user.id,
          personalUserId: user.id
        });

        const ctx = createContext(req, res, db);
        ctx.user = user;
        await ctx.audit({
          module: 'Settings', entityType: 'Backup',
          entityId: typeof fileName === 'string' ? fileName.slice(0, 255) : 'backup', action: 'Restore',
          newValue: { fileName: typeof fileName === 'string' ? fileName.slice(0, 255) : null, success: true, counts }
        });
        res.json({ success: true, data: { success: true, counts } });
      } catch (err) {
        sendError(res, err, 'backup restore');
      }
    }
  );

  return router;
}

module.exports = { createBackupRouter };
