const logger = require('../logger');

function parseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
}

function mapLog(r) {
  return {
    id: r.id,
    module: r.module,
    entityType: r.entity_type,
    entityId: r.entity_id,
    action: r.action,
    oldValue: parseJson(r.old_value),
    newValue: parseJson(r.new_value),
    performedBy: r.performed_by,
    performedAt: r.performed_at,
    ipOrDevice: r.ip_or_device
  };
}

class AuditRepository {
  constructor(db) {
    this.db = db;
  }

  async logAction({ module, entityType, entityId, action, oldValue, newValue, performedBy, ipOrDevice }) {
    try {
      const toText = (v) => (v !== undefined && v !== null ? (typeof v === 'string' ? v : JSON.stringify(v)) : null);

      await this.db.run(`
        INSERT INTO audit_logs (module, entity_type, entity_id, action, old_value, new_value, performed_by, performed_at, ip_or_device)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        module || 'General',
        entityType || 'Entity',
        entityId ? String(entityId) : null,
        action || 'UNKNOWN_ACTION',
        toText(oldValue),
        toText(newValue),
        performedBy || 'System',
        new Date().toISOString(),
        ipOrDevice || 'Desktop App'
      ]);
    } catch (err) {
      // Audit logging must NEVER throw or interrupt the primary business action
      logger.error(`Audit log insert error for module ${module}, action ${action}: ${err.message}`);
    }
  }

  async findAll(filters = {}) {
    try {
      const {
        startDate,
        endDate,
        user,
        module,
        action,
        search,
        limit = 100,
        offset = 0
      } = filters || {};

      const conditions = [];
      const params = [];

      if (startDate) {
        conditions.push('performed_at >= ?');
        params.push(startDate + 'T00:00:00.000Z');
      }

      if (endDate) {
        conditions.push('performed_at <= ?');
        params.push(endDate + 'T23:59:59.999Z');
      }

      if (user && user !== 'All') {
        conditions.push('LOWER(performed_by) = LOWER(?)');
        params.push(user);
      }

      if (module && module !== 'All') {
        conditions.push('LOWER(module) = LOWER(?)');
        params.push(module);
      }

      if (action && action !== 'All') {
        conditions.push('LOWER(action) = LOWER(?)');
        params.push(action);
      }

      if (search) {
        const q = `%${search.trim().toLowerCase()}%`;
        conditions.push(`(
          LOWER(module) LIKE ? OR
          LOWER(entity_type) LIKE ? OR
          LOWER(entity_id) LIKE ? OR
          LOWER(action) LIKE ? OR
          LOWER(performed_by) LIKE ? OR
          LOWER(old_value) LIKE ? OR
          LOWER(new_value) LIKE ?
        )`);
        params.push(q, q, q, q, q, q, q);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const totalRow = await this.db.get(`SELECT COUNT(*) AS total FROM audit_logs ${whereClause}`, params);
      const total = totalRow ? totalRow.total : 0;

      const rows = await this.db.all(`
        SELECT id, module, entity_type, entity_id, action, old_value, new_value, performed_by, performed_at, ip_or_device
        FROM audit_logs
        ${whereClause}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `, [...params, Number(limit) || 100, Number(offset) || 0]);

      return { logs: rows.map(mapLog), total };
    } catch (err) {
      logger.error(`Error querying audit logs: ${err.message}`);
      return { logs: [], total: 0 };
    }
  }

  async getById(id) {
    const row = await this.db.get('SELECT * FROM audit_logs WHERE id = ?', [id]);
    return row ? mapLog(row) : null;
  }
}

module.exports = AuditRepository;
