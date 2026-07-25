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
    if (window.api && window.api.auditLogs) {
      const res = await window.api.auditLogs.getAll(filters);
      if (res.success) return res.data;
      throw new Error(res.error || 'Failed to fetch audit logs');
    }

    // Fallback for browser-only preview
    return {
      logs: [
        {
          id: 1,
          module: 'Products',
          entityType: 'Product',
          entityId: 'PCM500',
          action: 'Edit',
          oldValue: { brandName: 'PCM 500mg', tp: 45, mrp: 60, status: 'Active' },
          newValue: { brandName: 'PCM 500mg', tp: 48, mrp: 65, status: 'Inactive' },
          performedBy: 'admin',
          performedAt: new Date(Date.now() - 3600000).toISOString(),
          ipOrDevice: 'Desktop App'
        },
        {
          id: 2,
          module: 'Orders',
          entityType: 'Order',
          entityId: 'PO-2026-001',
          action: 'Approved',
          oldValue: { status: 'Pending' },
          newValue: { status: 'Approved', approvedBy: 'admin' },
          performedBy: 'admin',
          performedAt: new Date(Date.now() - 7200000).toISOString(),
          ipOrDevice: 'Desktop App'
        }
      ],
      total: 2
    };
  },

  async getById(id) {
    if (window.api && window.api.auditLogs) {
      const res = await window.api.auditLogs.getById(id);
      if (res.success) return res.data;
      throw new Error(res.error || 'Failed to fetch audit log detail');
    }
    return null;
  },

  exportToCSV(logs = []) {
    if (!logs.length) return;

    const headers = ['ID', 'Timestamp', 'User', 'Module', 'Entity Type', 'Entity ID', 'Action', 'Device'];
    const csvRows = [headers.join(',')];

    logs.forEach(l => {
      const row = [
        l.id,
        `"${new Date(l.performedAt).toLocaleString()}"`,
        `"${l.performedBy || ''}"`,
        `"${l.module || ''}"`,
        `"${l.entityType || ''}"`,
        `"${l.entityId || ''}"`,
        `"${l.action || ''}"`,
        `"${l.ipOrDevice || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Audit_Logs_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export default auditService;
