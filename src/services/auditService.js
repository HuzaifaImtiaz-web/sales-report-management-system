import { csvCell, downloadCsv } from '../utils/exportUtils';

// Centralized audit service for fetching, calculating diffs, and exporting audit logs

export const calculateDiff = (oldVal, newVal) => {
  if (!oldVal && !newVal) return [];
  if (!oldVal) {
    return Object.entries(newVal || {})
      .filter(([k]) => !['id', 'created_at', 'updated_at'].includes(k))
      .map(([k, v]) => ({
        field: k,
        oldValue: '—',
        newValue: typeof v === 'object' ? JSON.stringify(v) : String(v)
      }));
  }
  if (!newVal) {
    return Object.entries(oldVal || {})
      .filter(([k]) => !['id', 'created_at', 'updated_at'].includes(k))
      .map(([k, v]) => ({
        field: k,
        oldValue: typeof v === 'object' ? JSON.stringify(v) : String(v),
        newValue: '—'
      }));
  }

  const allKeys = Array.from(new Set([...Object.keys(oldVal || {}), ...Object.keys(newVal || {})]))
    .filter(k => !['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt'].includes(k));

  const diffs = [];
  allKeys.forEach(key => {
    const o = oldVal[key];
    const n = newVal[key];

    const oStr = o !== undefined && o !== null ? (typeof o === 'object' ? JSON.stringify(o) : String(o)) : '';
    const nStr = n !== undefined && n !== null ? (typeof n === 'object' ? JSON.stringify(n) : String(n)) : '';

    if (oStr !== nStr) {
      diffs.push({
        field: key,
        oldValue: oStr || '—',
        newValue: nStr || '—'
      });
    }
  });

  return diffs;
};

export const auditService = {
  async getAll(filters = {}) {
    const res = await window.api.auditLogs.getAll(filters);
    if (res.success) return res.data;
    throw new Error(res.error || 'Failed to fetch audit logs');
  },

  async getById(id) {
    const res = await window.api.auditLogs.getById(id);
    if (res.success) return res.data;
    throw new Error(res.error || 'Failed to fetch audit log detail');
  },

  exportToCSV(logs = []) {
    if (!logs.length) return;

    const headers = ['ID', 'Timestamp', 'User', 'Module', 'Entity Type', 'Entity ID', 'Action', 'Device / IP'];
    const lines = [headers.map(csvCell).join(',')];
    logs.forEach((l) => {
      lines.push([
        l.id,
        new Date(l.performedAt).toLocaleString(),
        l.performedBy,
        l.module,
        l.entityType,
        l.entityId,
        l.action,
        l.ipOrDevice
      ].map(csvCell).join(','));
    });

    downloadCsv(`Audit_Logs_Export_${new Date().toISOString().split('T')[0]}.csv`, lines);
  }
};

export default auditService;
