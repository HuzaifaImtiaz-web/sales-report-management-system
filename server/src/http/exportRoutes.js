const express = require('express');
const config = require('../config');
const ExportService = require('../export/ExportService');
const AuditRepository = require('../repositories/AuditRepository');
const rateLimiter = require('../auth/rateLimiter');
const { AppError, ForbiddenError } = require('../errors');

// Same roles as the export data channels (permissionService.js: reports.export).
const EXPORT_ROLES = ['Admin', 'Manager'];
// Vercel functions cannot return more than 4.5 MB; other hosts have no such limit.
const MAX_FILE_BYTES = config.isVercel ? Math.floor(4.4 * 1024 * 1024) : 100 * 1024 * 1024;
const EXPORT_LIMIT = { max: 30, windowMs: 10 * 60 * 1000 };

function attachment(fileName) {
  // File names are built from letters, digits, underscores and a date, so they need no escaping.
  return `attachment; filename="${fileName}"`;
}

/**
 * POST /api/export  { reportType, format: 'excel'|'pdf'|'pptx', filters, timeZone }
 * Responds with the file itself (Content-Disposition: attachment).
 */
function createExportRouter({ db, authenticateRequest, sendError }) {
  const router = express.Router();

  router.post('/', express.json({ limit: '100kb', strict: true }), async (req, res) => {
    try {
      const { user } = await authenticateRequest(req, db);
      if (!EXPORT_ROLES.includes(user.role)) {
        throw new ForbiddenError(`Permission denied: the ${user.role} role cannot export reports.`);
      }
      await rateLimiter.consume(db, `export:${user.id}`, EXPORT_LIMIT);

      const { reportType, format, filters, timeZone } = req.body || {};
      if (!reportType || typeof reportType !== 'string') throw new AppError('Choose a report to export.');

      const file = await new ExportService(db, { timeZone }).generate({
        reportType, format, filters, user: user.username
      });
      if (file.buffer.length > MAX_FILE_BYTES) {
        throw new AppError('This export is too large to download as one file. Narrow the filters (for example a shorter date range) and try again.', 413);
      }

      await new AuditRepository(db).logAction({
        module: 'Export Center',
        entityType: file.isMaster ? 'MasterExportFile' : 'ExportFile',
        entityId: file.fileName,
        action: `${file.isMaster ? 'Master Export' : 'Export'} ${file.format.toUpperCase()}`,
        newValue: {
          reportType,
          format: file.format,
          fileName: file.fileName,
          totalRecords: file.totalRecords,
          sizeBytes: file.buffer.length,
          filters
        },
        performedBy: user.username,
        ipOrDevice: req.ip ? String(req.ip).slice(0, 64) : null
      });

      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', attachment(file.fileName));
      res.setHeader('Content-Length', String(file.buffer.length));
      res.setHeader('X-Export-Records', String(file.totalRecords || 0));
      res.end(file.buffer);
    } catch (err) {
      sendError(res, err, 'export');
    }
  });

  return router;
}

module.exports = { createExportRouter, MAX_FILE_BYTES };
