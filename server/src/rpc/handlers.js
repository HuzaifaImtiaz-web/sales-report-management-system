// Server version of electron/ipc.cjs. Channel names, arguments and return values are unchanged,
// so the React screens keep calling window.api.* exactly as before.
//
// Each entry: { handler(ctx, ...args), public?, recovery?, roles?, rateLimit? }
//   public    - no login needed
//   recovery  - needs the short-lived token from the emergency recovery password/PIN
//   roles     - allowed roles (default: any signed-in user)

const ProductRepository = require('../repositories/ProductRepository');
const AreaRepository = require('../repositories/AreaRepository');
const DoctorRepository = require('../repositories/DoctorRepository');
const InstitutionRepository = require('../repositories/InstitutionRepository');
const TeamMemberRepository = require('../repositories/TeamMemberRepository');
const TargetRepository = require('../repositories/TargetRepository');
const OrderRepository = require('../repositories/OrderRepository');
const ReportRepository = require('../repositories/ReportRepository');
const SettingsRepository = require('../repositories/SettingsRepository');
const CategoryRepository = require('../repositories/CategoryRepository');
const AuditRepository = require('../repositories/AuditRepository');
const { TaskRepository, ReminderRepository } = require('../repositories/PersonalItemsRepository');
const ValidationService = require('../validation/ValidationService');
const AnalyticsService = require('../services/AnalyticsService');
const SearchService = require('../services/SearchService');
const ExportDataService = require('../services/ExportDataService');
const HealthService = require('../services/HealthService');
const SnapshotService = require('../services/SnapshotService');
const AuthService = require('../auth/AuthService');
const RecoveryService = require('../auth/RecoveryService');
const { signAccessToken, signRecoveryToken } = require('../auth/tokens');
const { ForbiddenError } = require('../errors');

const ADMIN = ['Admin'];
// Mirrors src/services/permissionService.js: Managers may create/edit master data, only Admins delete.
const MANAGERS = ['Admin', 'Manager'];

// Per IP address. Only failed logins count, so a whole office behind one internet connection can
// still sign in at 9 a.m.; each account also locks for 15 minutes after 5 wrong passwords.
const LOGIN_LIMIT = { max: 50, windowMs: 15 * 60 * 1000, failuresOnly: true, key: (ctx) => `login:${ctx.ip}` };
const RECOVERY_LIMIT = { max: 10, windowMs: 15 * 60 * 1000, key: (ctx) => `recovery:${ctx.ip}` };

function createServices(db) {
  return {
    products: new ProductRepository(db),
    areas: new AreaRepository(db),
    doctors: new DoctorRepository(db),
    institutions: new InstitutionRepository(db),
    teamMembers: new TeamMemberRepository(db),
    targets: new TargetRepository(db),
    orders: new OrderRepository(db),
    reports: new ReportRepository(db),
    settings: new SettingsRepository(db),
    categories: new CategoryRepository(db),
    audit: new AuditRepository(db),
    tasks: new TaskRepository(db),
    reminders: new ReminderRepository(db),
    validator: new ValidationService(db),
    analytics: new AnalyticsService(db),
    search: new SearchService(db),
    exportData: new ExportDataService(db),
    health: new HealthService(db),
    auth: new AuthService(db),
    recovery: new RecoveryService(db)
  };
}

const username = (ctx) => (ctx.user ? ctx.user.username : 'System');

/**
 * Standard save/delete handlers for master data screens (validate -> save -> audit), as in ipc.cjs.
 */
function masterDataHandlers(prefix, { repo, validatorKey, module, entityType, sanitize = true, auditDeleteAttempts = false }) {
  return {
    [`${prefix}:getAll`]: {
      handler: (ctx) => ctx.s[repo].findAll()
    },
    [`${prefix}:getById`]: {
      handler: (ctx, id) => ctx.s[repo].findById(id)
    },
    [`${prefix}:save`]: {
      roles: MANAGERS,
      handler: async (ctx, input) => {
        const { s } = ctx;
        const clean = sanitize ? s.validator.sanitize(input || {}) : (input || {});
        if (validatorKey) {
          await s.validator.validate(module, `Save ${entityType}`, () => s.validator[validatorKey].validateSave(clean));
        }
        const oldVal = clean.id ? await s[repo].findById(clean.id) : null;
        const res = clean.id ? await s[repo].update(clean.id, clean) : await s[repo].create(clean);

        let action = clean.id ? 'Update' : 'Create';
        if (prefix === 'products' && clean.id) {
          action = oldVal && oldVal.status !== res.status ? 'Status Change' : 'Edit';
        }
        await ctx.audit({ module, entityType, entityId: res.id, action, oldValue: oldVal, newValue: res });
        return res;
      }
    },
    [`${prefix}:delete`]: {
      roles: ADMIN,
      handler: async (ctx, id) => {
        const { s } = ctx;
        const oldVal = await s[repo].findById(id);

        if (!auditDeleteAttempts) {
          if (validatorKey) {
            await s.validator.validate(module, `Delete ${entityType}`, () => s.validator[validatorKey].validateDelete(id));
          }
          const res = await s[repo].delete(id);
          if (res || validatorKey) {
            await ctx.audit({ module, entityType, entityId: id, action: 'Delete', oldValue: oldVal });
          }
          return res;
        }

        try {
          await s.validator.validate(module, `Delete ${entityType}`, () => s.validator[validatorKey].validateDelete(id));
          const res = await s[repo].delete(id);
          await ctx.audit({ module, entityType, entityId: id, action: 'Delete Success', oldValue: oldVal });
          return res;
        } catch (err) {
          await ctx.audit({ module, entityType, entityId: id, action: 'Delete Attempt', oldValue: oldVal, newValue: { error: err.message } });
          throw err;
        }
      }
    }
  };
}

const handlers = {
  // --- Product Groups ---
  ...masterDataHandlers('categories', { repo: 'categories', module: 'Groups', entityType: 'Group', sanitize: false }),
  'divisions:getAll': {
    handler: (ctx) => ctx.s.categories.findAllDivisions()
  },

  // --- Master data ---
  ...masterDataHandlers('products', { repo: 'products', validatorKey: 'product', module: 'Products', entityType: 'Product', auditDeleteAttempts: true }),
  ...masterDataHandlers('areas', { repo: 'areas', validatorKey: 'area', module: 'Areas', entityType: 'Area' }),
  ...masterDataHandlers('doctors', { repo: 'doctors', validatorKey: 'doctor', module: 'Doctors', entityType: 'Doctor' }),
  ...masterDataHandlers('institutions', { repo: 'institutions', validatorKey: 'institution', module: 'Institutions', entityType: 'Institution' }),
  ...masterDataHandlers('teamMembers', { repo: 'teamMembers', validatorKey: 'teamMember', module: 'Team Members', entityType: 'TeamMember' }),
  ...masterDataHandlers('targets', { repo: 'targets', validatorKey: 'target', module: 'Targets', entityType: 'Target' }),
  'targets:getActiveBusinessYears': {
    handler: (ctx) => ctx.s.targets.getActiveBusinessYears()
  },

  // --- Orders (every role can enter and process orders, as the Sales Entry screen allows today) ---
  'orders:getAll': {
    handler: (ctx) => ctx.s.orders.findAll()
  },
  'orders:getById': {
    handler: (ctx, id) => ctx.s.orders.findById(id)
  },
  'orders:save': {
    handler: async (ctx, input) => {
      const { s } = ctx;
      const clean = s.validator.sanitize(input || {});
      const role = ctx.user.role;
      const user = username(ctx);
      const oldVal = clean.id ? await s.orders.findById(clean.id) : null;

      try {
        await s.validator.validate('Orders', 'Save Order', () => s.validator.order.validateSave(clean, role));
      } catch (err) {
        if (oldVal && ['Completed', 'Cancelled'].includes(oldVal.status)) {
          await ctx.audit({
            module: 'Orders', entityType: 'Order', entityId: clean.id,
            action: 'Edit Attempt on Locked Order', oldValue: oldVal, newValue: clean
          });
        }
        throw err;
      }

      let recalculatedTotal = 0;
      let hasPriceOverride = false;
      const itemsList = clean.items || clean.products || [];

      for (const item of itemsList) {
        const qty = Number(item.quantity || item.qty || 1);
        const rate = Number(item.unitPrice !== undefined ? item.unitPrice : (item.rate || 0));
        item.quantity = qty;
        item.unitPrice = rate;
        item.totalPrice = qty * rate;
        recalculatedTotal += item.totalPrice;

        if (item.productId) {
          const p = await s.products.findById(item.productId);
          if (p && p.tp !== undefined && Number(p.tp) !== rate) {
            hasPriceOverride = true;
          }
        }
      }

      clean.items = itemsList;
      clean.totalAmount = recalculatedTotal;
      clean.status = clean.status || 'Pending';

      // New orders are always attributed to the signed-in user (the client cannot pick a name).
      const res = clean.id
        ? await s.orders.update(clean.id, clean)
        : await s.orders.create({ ...clean, createdBy: user }, user);

      await ctx.audit({
        module: 'Orders', entityType: 'Order', entityId: res.id,
        action: clean.id ? 'Order Edited' : 'Order Created', oldValue: oldVal, newValue: res
      });

      if (hasPriceOverride) {
        await ctx.audit({
          module: 'Orders', entityType: 'Order', entityId: res.id,
          action: 'Price Override', oldValue: null, newValue: { orderNumber: res.orderNumber, items: res.items }
        });
      }

      return res;
    }
  },
  'orders:changeStatus': {
    handler: async (ctx, id, newStatus, reason = '') => {
      const { s } = ctx;
      const currentOrder = await s.orders.findById(id);
      if (!currentOrder) {
        throw new Error(`Order with ID ${id} not found.`);
      }

      await s.validator.validate('Orders', 'Change Status', () =>
        s.validator.order.validateStatusTransition(currentOrder.status, newStatus, ctx.user.role, reason)
      );

      const res = await s.orders.changeStatus(id, newStatus, reason, username(ctx));

      let action = 'Status Changed';
      if (newStatus === 'Completed') action = 'Sale Completed';
      else if (newStatus === 'Cancelled') action = 'Sale Cancelled';

      await ctx.audit({ module: 'Orders', entityType: 'Order', entityId: id, action, oldValue: currentOrder, newValue: res });
      return res;
    }
  },
  'orders:delete': {
    handler: async (ctx, id) => {
      const { s } = ctx;
      const oldVal = await s.orders.findById(id);
      try {
        await s.validator.validate('Orders', 'Delete Order', () => s.validator.order.validateDelete(id, ctx.user.role));
        const res = await s.orders.delete(id);
        await ctx.audit({ module: 'Orders', entityType: 'Order', entityId: id, action: 'Order Deleted', oldValue: oldVal, newValue: null });
        return res;
      } catch (err) {
        await ctx.audit({
          module: 'Orders', entityType: 'Order', entityId: id,
          action: 'Delete Attempt', oldValue: oldVal, newValue: { error: err.message }
        });
        throw err;
      }
    }
  },

  // --- Settings (company-wide; a few personal keys are stored per user) ---
  'settings:getAll': {
    handler: (ctx) => ctx.s.settings.findAll(ctx.user.id)
  },
  'settings:save': {
    handler: async (ctx, key, value, groupName) => {
      if (!key || typeof key !== 'string' || key.startsWith('user:')) {
        throw new Error('Invalid setting key.');
      }
      if (!SettingsRepository.isPersonalKey(key) && ctx.user.role !== 'Admin') {
        throw new ForbiddenError('Permission denied: only administrators can change company-wide settings.');
      }
      const oldVal = await ctx.s.settings.findByKey(key, ctx.user.id);
      const res = await ctx.s.settings.save(key, value, groupName, ctx.user.id);

      let action = 'Update Setting';
      if (key === 'active_business_year' || key === 'business_year') {
        action = 'Business Year Change';
      } else if (key === 'production_mode' || key === 'mode') {
        action = 'Production Mode Change';
      }

      await ctx.audit({
        module: 'Settings', entityType: 'Setting', entityId: key, action,
        oldValue: { key, value: oldVal }, newValue: { key, value }
      });
      return res;
    }
  },
  'settings:getByKey': {
    handler: async (ctx, key) => {
      const val = await ctx.s.settings.findByKey(key, ctx.user.id);
      return val ? { value: val } : null;
    }
  },

  // --- Reports & Dashboard ---
  'reports:getDashboardSummaryData': { handler: (ctx, filters) => ctx.s.reports.getDashboardSummaryData(filters) },
  'reports:getSalesTrendData': { handler: (ctx, filters) => ctx.s.reports.getSalesTrendData(filters) },
  'reports:getTargetAchievementData': { handler: (ctx, filters) => ctx.s.reports.getTargetAchievementData(filters) },
  'reports:getTeamContributionData': { handler: (ctx, filters) => ctx.s.reports.getTeamContributionData(filters) },
  'reports:getProductPerformanceData': { handler: (ctx, filters) => ctx.s.reports.getProductPerformanceData(filters) },
  'reports:getReportsData': { handler: (ctx, filters) => ctx.s.reports.getReportsData(filters) },

  // --- Tasks & Reminders (private to each user) ---
  'tasks:getAll': { handler: (ctx) => ctx.s.tasks.findAll(ctx.user.id) },
  'tasks:save': { handler: (ctx, task) => ctx.s.tasks.save(task || {}, ctx.user.id) },
  'tasks:delete': { handler: (ctx, id) => ctx.s.tasks.delete(id, ctx.user.id) },
  'reminders:getAll': { handler: (ctx) => ctx.s.reminders.findAll(ctx.user.id) },
  'reminders:save': { handler: (ctx, reminder) => ctx.s.reminders.save(reminder || {}, ctx.user.id) },
  'reminders:delete': { handler: (ctx, id) => ctx.s.reminders.delete(id, ctx.user.id) },

  // --- Emergency recovery (from the login screen) ---
  'auth:recoveryVerifyPassword': {
    public: true,
    rateLimit: RECOVERY_LIMIT,
    handler: async (ctx, password) => {
      await ctx.s.recovery.verifyRecoveryPassword(password);
      await ctx.audit({
        module: 'Authentication', entityType: 'Emergency Recovery', entityId: 'SYSTEM',
        action: 'Emergency Recovery Login', oldValue: null, newValue: { access: 'Granted' }, performedBy: 'Emergency Recovery'
      });
      return { verified: true, recoveryToken: signRecoveryToken() };
    }
  },
  'auth:verifyRecoveryPin': {
    public: true,
    rateLimit: RECOVERY_LIMIT,
    handler: async (ctx, { pin } = {}) => {
      await ctx.s.recovery.verifyRecoveryPin(pin);
      await ctx.audit({
        module: 'Authentication', entityType: 'Emergency Recovery', entityId: 'SYSTEM',
        action: 'Emergency Recovery Login (PIN)', oldValue: null, newValue: { access: 'Granted' }, performedBy: 'Emergency Recovery'
      });
      return { verified: true, recoveryToken: signRecoveryToken() };
    }
  },
  'auth:resetRecoveryPasswordWithPin': {
    public: true,
    rateLimit: RECOVERY_LIMIT,
    handler: (ctx, { pin, newPassword } = {}) => ctx.s.recovery.resetRecoveryPasswordWithPin(pin, newPassword)
  },
  'auth:recoveryGetUsers': {
    public: true,
    recovery: true,
    handler: (ctx) => ctx.s.recovery.getAllUsers()
  },
  'auth:recoveryToggleUserStatus': {
    public: true,
    recovery: true,
    handler: async (ctx, data) => {
      const { user, updatedUser, result } = await ctx.s.recovery.toggleUserStatus(data || {});
      const action = updatedUser.isActive ? 'User Enabled' : 'User Disabled';
      await ctx.audit({
        module: 'Authentication', entityType: 'User', entityId: String(user.id), action,
        oldValue: { username: user.username, status: user.isActive ? 'Enabled' : 'Disabled' },
        newValue: { username: user.username, status: updatedUser.isActive ? 'Enabled' : 'Disabled' },
        performedBy: 'Emergency Recovery'
      });
      return result;
    }
  },
  'auth:recoveryResetUserPassword': {
    public: true,
    recovery: true,
    handler: async (ctx, data) => {
      const { user, result } = await ctx.s.recovery.resetUserPassword(data || {});
      await ctx.audit({
        module: 'Authentication', entityType: 'User', entityId: String(user.id), action: 'Password Reset',
        oldValue: { username: user.username, passwordReset: false },
        newValue: { username: user.username, passwordReset: true },
        performedBy: 'Emergency Recovery'
      });
      return result;
    }
  },

  // --- Authentication ---
  'auth:getSecurityStatus': {
    public: true,
    handler: (ctx) => ctx.s.auth.getSecurityStatus()
  },
  'auth:completeFirstLoginWizard': {
    roles: ADMIN,
    handler: async (ctx, data) => {
      const { result, user } = await ctx.s.auth.completeFirstLoginWizard(ctx.user.id, data || {});
      ctx.refreshedToken = signAccessToken(user);
      return result;
    }
  },
  'auth:changeUsername': {
    handler: async (ctx, { currentPassword, newUsername } = {}) =>
      ctx.s.auth.changeUsername(ctx.user.id, currentPassword, newUsername)
  },
  'auth:changeRecoveryPassword': {
    roles: ADMIN,
    handler: (ctx, { currentPassword, newPassword } = {}) => ctx.s.recovery.changeRecoveryPassword(currentPassword, newPassword)
  },
  'auth:changeRecoveryPin': {
    roles: ADMIN,
    handler: (ctx, { currentAuth, newPin } = {}) => ctx.s.recovery.changeRecoveryPin(currentAuth, newPin)
  },
  'auth:login': {
    public: true,
    rateLimit: LOGIN_LIMIT,
    handler: async (ctx, { username: loginName, password } = {}) => {
      try {
        const res = await ctx.s.auth.login(loginName, password);
        await ctx.audit({
          module: 'Authentication', entityType: 'User', entityId: res.session.user.username, action: 'Login',
          newValue: { username: res.session.user.username, role: res.session.user.role },
          performedBy: res.session.user.username
        });
        return res;
      } catch (err) {
        await ctx.audit({
          module: 'Authentication', entityType: 'User', entityId: loginName, action: 'Failed Login',
          oldValue: { username: loginName, error: err.message }, performedBy: loginName || 'Guest'
        });
        throw err;
      }
    }
  },
  'auth:logout': {
    handler: async (ctx) => {
      await ctx.audit({ module: 'Authentication', entityType: 'User', entityId: username(ctx), action: 'Logout' });
      return true;
    }
  },
  'auth:createUser': {
    roles: ADMIN,
    handler: async (ctx, payload) => {
      const res = await ctx.s.auth.createUser(payload || {});
      await ctx.audit({
        module: 'Authentication', entityType: 'User', entityId: payload.username, action: 'Create User',
        newValue: { username: payload.username, role: payload.role }
      });
      return res;
    }
  },
  'auth:changePassword': {
    handler: async (ctx, { oldPassword, newPassword } = {}) => {
      const updated = await ctx.s.auth.changePassword(ctx.user.id, oldPassword, newPassword);
      // Other computers signed in as this user are logged out; this one gets a new token.
      ctx.refreshedToken = signAccessToken(updated);
      await ctx.audit({ module: 'Authentication', entityType: 'User', entityId: username(ctx), action: 'Password Change' });
      return true;
    }
  },
  'auth:resetPassword': {
    roles: ADMIN,
    handler: async (ctx, { username: target, newPassword } = {}) => {
      const updated = await ctx.s.auth.resetPassword(target, newPassword);
      if (updated.id === ctx.user.id) ctx.refreshedToken = signAccessToken(updated);
      await ctx.audit({ module: 'Authentication', entityType: 'User', entityId: target, action: 'Password Change' });
      return true;
    }
  },
  'auth:activateUser': {
    roles: ADMIN,
    handler: (ctx, { username: target } = {}) => ctx.s.auth.activateUser(target)
  },
  'auth:disableUser': {
    roles: ADMIN,
    handler: (ctx, { username: target } = {}) => ctx.s.auth.disableUser(target)
  },
  'auth:getAllUsers': {
    roles: ADMIN,
    handler: (ctx) => ctx.s.auth.getAllUsers()
  },
  'auth:changeRole': {
    roles: ADMIN,
    handler: (ctx, { username: target, role } = {}) => ctx.s.auth.changeRole(target, role)
  },
  'auth:deleteUser': {
    roles: ADMIN,
    handler: async (ctx, target) => {
      const targetUsername = target && typeof target === 'object' ? target.username : target;
      const res = await ctx.s.auth.deleteUser(targetUsername);
      await ctx.audit({ module: 'Authentication', entityType: 'User', entityId: targetUsername, action: 'Delete' });
      return res;
    }
  },

  // --- Backup & Restore (the desktop app saves/reads the backup file) ---
  'backup:export': {
    roles: ADMIN,
    handler: async (ctx) => {
      const snapshot = await SnapshotService.exportSnapshot(ctx.db, { createdBy: username(ctx) });
      await ctx.audit({
        module: 'Settings', entityType: 'Backup', entityId: snapshot.createdAt, action: 'Backup',
        newValue: { createdAt: snapshot.createdAt, tables: Object.keys(snapshot.tables).length }
      });
      return snapshot;
    }
  },
  'backup:restore': {
    roles: ADMIN,
    handler: async (ctx, snapshot, meta = {}) => {
      const counts = await SnapshotService.restoreSnapshot(ctx.db, snapshot, {
        fallbackUserId: ctx.user.id,
        personalUserId: ctx.user.id
      });
      await ctx.audit({
        module: 'Settings', entityType: 'Backup', entityId: (meta && meta.fileName) || 'backup', action: 'Restore',
        newValue: { fileName: meta && meta.fileName, success: true, counts }
      });
      return { success: true, counts };
    }
  },

  // --- Audit Logs ---
  'auditLogs:getAll': { roles: ADMIN, handler: (ctx, filters) => ctx.s.audit.findAll(filters) },
  'auditLogs:getById': { roles: ADMIN, handler: (ctx, id) => ctx.s.audit.getById(id) },

  // --- Health ---
  'integrity:check': { roles: ADMIN, handler: (ctx) => ctx.s.health.runIntegrityCheck() },
  'diagnostics:get': { roles: ADMIN, handler: (ctx) => ctx.s.health.getDiagnostics() },

  // --- Global Search ---
  'search:global': { handler: (ctx, query) => ctx.s.search.globalSearch(query) },

  // --- Analytics ---
  'analytics:getDashboardSummary': { handler: (ctx) => ctx.s.analytics.getDashboardSummary() },
  'analytics:getMonthlySales': { handler: (ctx) => ctx.s.analytics.getMonthlySales() },
  'analytics:getTopProducts': { handler: (ctx) => ctx.s.analytics.getTopProducts() },
  'analytics:getAreaPerformance': { handler: (ctx) => ctx.s.analytics.getAreaPerformance() },
  'analytics:getRepresentativePerformance': { handler: (ctx) => ctx.s.analytics.getRepresentativePerformance() },
  'analytics:getTargetProgress': { handler: (ctx) => ctx.s.analytics.getTargetProgress() },
  'analytics:getRecentOrders': { handler: (ctx) => ctx.s.analytics.getRecentOrders() },

  // --- Export Center data (the desktop app builds the Excel/PDF/PowerPoint file) ---
  'export:getPreviewData': {
    roles: MANAGERS,
    handler: (ctx, { reportType, filters } = {}) => ctx.s.exportData.fetchData(reportType, filters)
  },
  'export:getMasterData': {
    roles: MANAGERS,
    handler: (ctx, { filters } = {}) => ctx.s.exportData.fetchMasterData(filters)
  },
  'export:logExport': {
    handler: async (ctx, entry = {}) => {
      const isMaster = Boolean(entry.isMaster);
      const ext = String(entry.format || '').toUpperCase().slice(0, 10);
      await ctx.audit({
        module: 'Export Center',
        entityType: isMaster ? 'MasterExportFile' : 'ExportFile',
        entityId: String(entry.fileName || '').slice(0, 255),
        action: isMaster ? `Master Export ${ext}` : `Export ${ext}`,
        newValue: {
          reportType: entry.reportType,
          format: entry.format,
          fileName: entry.fileName,
          totalRecords: entry.totalRecords,
          filters: entry.filters
        }
      });
      return true;
    }
  }
};

module.exports = { handlers, createServices };
