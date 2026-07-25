const logger = require('../logger.cjs');

class AuditRepository {
  constructor(db) {
    this.db = db;
  }

  logAction({ module, entityType, entityId, action, oldValue, newValue, performedBy, ipOrDevice }) {
    try {
      const oldStr = oldValue !== undefined && oldValue !== null ? (typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue)) : null;
      const newStr = newValue !== undefined && newValue !== null ? (typeof newValue === 'string' ? newValue : JSON.stringify(newValue)) : null;
      const user = performedBy || 'System';
      const nowIso = new Date().toISOString();

      const stmt = this.db.prepare(`
        INSERT INTO audit_logs (module, entity_type, entity_id, action, old_value, new_value, performed_by, performed_at, ip_or_device)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        module || 'General',
        entityType || 'Entity',
        entityId ? String(entityId) : null,
        action || 'UNKNOWN_ACTION',
        oldStr,
        newStr,
        user,
        nowIso,
        ipOrDevice || 'Desktop App'
      );
    } catch (err) {
      // Audit logging must NEVER throw or interrupt the primary business action
      logger.error(`Audit log insert error for module ${module}, action ${action}: ${err.message}`);
    }
  }

  findAll(filters = {}) {
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
      } = filters;

      let conditions = [];
      let params = [];

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

      // Count query
      const countStmt = this.db.prepare(`SELECT COUNT(*) as total FROM audit_logs ${whereClause}`);
      const totalRow = countStmt.get(...params);
      const total = totalRow ? totalRow.total : 0;

      // Data query
      const dataStmt = this.db.prepare(`
        SELECT id, module, entity_type, entity_id, action, old_value, new_value, performed_by, performed_at, ip_or_device
        FROM audit_logs
        ${whereClause}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `);

      const rows = dataStmt.all(...params, Number(limit), Number(offset));

      const logs = rows.map(r => {
        let oldParsed = null;
        let newParsed = null;

        try {
          if (r.old_value) oldParsed = JSON.parse(r.old_value);
        } catch (e) {
          oldParsed = r.old_value;
        }

        try {
          if (r.new_value) newParsed = JSON.parse(r.new_value);
        } catch (e) {
          newParsed = r.new_value;
        }

        return {
          id: r.id,
          module: r.module,
          entityType: r.entity_type,
          entityId: r.entity_id,
          action: r.action,
          oldValue: oldParsed,
          newValue: newParsed,
          performedBy: r.performed_by,
          performedAt: r.performed_at,
          ipOrDevice: r.ip_or_device
        };
      });

      return { logs, total };
    } catch (err) {
      logger.error(`Error querying audit logs: ${err.message}`);
      return { logs: [], total: 0 };
    }
  }

  getById(id) {
    const row = this.db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(id);
    if (!row) return null;

    let oldParsed = null;
    let newParsed = null;

    try {
      if (row.old_value) oldParsed = JSON.parse(row.old_value);
    } catch (e) {
      oldParsed = row.old_value;
    }

    try {
      if (row.new_value) newParsed = JSON.parse(row.new_value);
    } catch (e) {
      newParsed = row.new_value;
    }

    return {
      id: row.id,
      module: row.module,
      entityType: row.entity_type,
      entityId: row.entity_id,
      action: row.action,
      oldValue: oldParsed,
      newValue: newParsed,
      performedBy: row.performed_by,
      performedAt: row.performed_at,
      ipOrDevice: row.ip_or_device
    };
  }
}

module.exports = AuditRepository;
