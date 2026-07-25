/**
 * Role-Based Access Control (RBAC) Permission Matrix & Service
 * Himmel Pharmaceutical Sales Management System
 */

const ROLE_PERMISSIONS = {
  Admin: [
    // Products
    'products.view', 'products.create', 'products.edit', 'products.delete', 'products.status',
    // Doctors
    'doctors.view', 'doctors.create', 'doctors.edit', 'doctors.delete',
    // Institutions
    'institutions.view', 'institutions.create', 'institutions.edit', 'institutions.delete',
    // Areas
    'areas.view', 'areas.create', 'areas.edit', 'areas.delete',
    // Team Members
    'teamMembers.view', 'teamMembers.create', 'teamMembers.edit', 'teamMembers.delete',
    // Product Groups
    'groups.view', 'groups.create', 'groups.edit', 'groups.delete',
    // Orders
    'orders.view', 'orders.create', 'orders.edit', 'orders.approve', 'orders.complete', 'orders.cancel', 'orders.delete',
    // Targets
    'targets.view', 'targets.create', 'targets.edit', 'targets.delete',
    // Reports & Export
    'reports.view', 'reports.export',
    // System Audit & Maintenance
    'audit.view', 'settings.modify', 'settings.backup', 'settings.restore', 'settings.users', 'settings.maintenance'
  ],

  Manager: [
    'products.view', 'products.create', 'products.edit',
    'doctors.view', 'doctors.create', 'doctors.edit',
    'institutions.view', 'institutions.create', 'institutions.edit',
    'areas.view', 'areas.create', 'areas.edit',
    'teamMembers.view', 'teamMembers.create', 'teamMembers.edit',
    'groups.view', 'groups.create', 'groups.edit',
    'orders.view', 'orders.create', 'orders.edit', 'orders.approve', 'orders.cancel',
    'targets.view', 'targets.create', 'targets.edit',
    'reports.view', 'reports.export',
    'audit.view'
  ],

  'Sales Representative': [
    'products.view',
    'doctors.view',
    'institutions.view',
    'areas.view',
    'teamMembers.view',
    'groups.view',
    'orders.view', 'orders.create', 'orders.edit',
    'targets.view',
    'reports.view'
  ],

  Rep: [
    'products.view',
    'doctors.view',
    'institutions.view',
    'areas.view',
    'teamMembers.view',
    'groups.view',
    'orders.view', 'orders.create', 'orders.edit',
    'targets.view',
    'reports.view'
  ]
};

/**
 * Checks if a given role has a specific permission.
 * @param {string} role User role (e.g. 'Admin', 'Manager', 'Sales Representative')
 * @param {string} permission Permission key (e.g. 'products.edit')
 * @returns {boolean} True if permitted
 */
export function hasPermission(role, permission) {
  if (!role || !permission) return false;
  
  const normRole = String(role).trim();
  if (normRole.toLowerCase() === 'admin') return true;

  let permissions = ROLE_PERMISSIONS[normRole];
  if (!permissions) {
    const matchKey = Object.keys(ROLE_PERMISSIONS).find(
      (k) => k.toLowerCase() === normRole.toLowerCase()
    );
    if (matchKey) {
      permissions = ROLE_PERMISSIONS[matchKey];
    }
  }

  return permissions ? permissions.includes(permission) : false;
}

export function getRolePermissions(role) {
  if (!role) return [];
  const normRole = String(role).trim();
  if (normRole.toLowerCase() === 'admin') return ROLE_PERMISSIONS.Admin;
  
  const matchKey = Object.keys(ROLE_PERMISSIONS).find(
    (k) => k.toLowerCase() === normRole.toLowerCase()
  );
  return matchKey ? ROLE_PERMISSIONS[matchKey] : [];
}

export default {
  hasPermission,
  getRolePermissions,
  ROLE_PERMISSIONS
};
