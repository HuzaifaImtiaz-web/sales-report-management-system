// Operations behind POST /api/rpc/<channel>. The web app's window.api.* methods map to these
// channel names one to one (src/api/webApi.js).
//
// Each entry: { handler(ctx, ...args), public?, optionalSession?, recovery?, roles?, rateLimit? }
//   public          - no sign-in needed
//   optionalSession - public, but the signed-in user is loaded when there is one
//   recovery        - needs the short-lived session opened by the emergency recovery password/PIN
//   roles           - allowed roles (default: any signed-in user)
//   rateLimit       - attempt limit stored in the database (failuresOnly: only failed attempts count)

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
const { deleteUserSessions } = require('../auth/sessions');
const { ForbiddenError } = require('../errors');

const ADMIN = ['Admin'];
// Mirrors src/services/permissionService.js: Managers may create/edit master data, only Admins delete.
const MANAGERS = ['Admin', 'Manager'];

// Who may move an order to each final status (permissionService.js: orders.complete is Admin only,
// orders.cancel is Admin and Manager). Sales representatives create and edit pending orders.
const ORDER_STATUS_ROLES = { Completed: ADMIN, Cancelled: MANAGERS };

const FIFTEEN_MINUTES = 15 * 60 * 1000;
// Per IP address. Only failed sign-ins count, so a whole office behind one internet connection can
// still sign in at 9 a.m.; each account also locks for 15 minutes after 5 wrong passwords.
const LOGIN_LIMIT = { max: 30, windowMs: FIFTEEN_MINUTES, failuresOnly: true, key: (ctx) => `login:${ctx.ip}` };
const RECOVERY_LIMIT = { max: 10, windowMs: FIFTEEN_MINUTES, key: (ctx) => `recovery:${ctx.ip}` };
// Operations that re-check the user's own password: a stolen session cannot guess it quickly.
const REAUTH_LIMIT = { max: 10, windowMs: FIFTEEN_MINUTES, failuresOnly: true, key: (ctx) => `reauth:${ctx.user.id}` };

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
  'targets:createBusinessYear': {
    roles: ADMIN,
    handler: async (ctx, { yearName, copyPreviousTargets } = {}) => {
      const year = await ctx.s.targets.createBusinessYear({ yearName, copyPreviousTargets: Boolean(copyPreviousTargets) });
      await ctx.audit({ module: 'Targets', entityType: 'BusinessYear', entityId: year.id, action: 'Create', newValue: year });
      return year;
    }
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
      const allowedRoles = ORDER_STATUS_ROLES[newStatus];
      if (allowedRoles && !allowedRoles.includes(ctx.user.role)) {
        throw new ForbiddenError(`Permission denied: the ${ctx.user.role} role cannot mark orders as ${newStatus}.`);
      }
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
    roles: ADMIN,
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
      return { verified: true, csrfToken: await ctx.startRecovery() };
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
      return { verified: true, csrfToken: await ctx.startRecovery() };
    }
  },
  'auth:resetRecoveryPasswordWithPin': {
    public: true,
    rateLimit: RECOVERY_LIMIT,
    handler: async (ctx, { pin, newPassword } = {}) => {
      const res = await ctx.s.recovery.resetRecoveryPasswordWithPin(pin, newPassword);
      await ctx.audit({
        module: 'Authentication', entityType: 'Emergency Recovery', entityId: 'SYSTEM',
        action: 'Recovery Password Reset (PIN)', performedBy: 'Emergency Recovery'
      });
      return res;
    }
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
      if (!updatedUser.isActive) await deleteUserSessions(ctx.db, user.id);
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
      await deleteUserSessions(ctx.db, user.id);
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
  'auth:login': {
    public: true,
    rateLimit: LOGIN_LIMIT,
    handler: async (ctx, { username: loginName, password } = {}) => {
      const attempted = typeof loginName === 'string' ? loginName.trim().slice(0, 100) : '';
      try {
        const user = await ctx.s.auth.login(loginName, password);
        const { csrfToken } = await ctx.signIn(user);
        const sessionUser = AuthService.toSessionUser(user);
        await ctx.audit({
          module: 'Authentication', entityType: 'User', entityId: sessionUser.username, action: 'Login',
          newValue: { username: sessionUser.username, role: sessionUser.role },
          performedBy: sessionUser.username
        });
        return { user: sessionUser, loginTimestamp: new Date().toISOString(), csrfToken };
      } catch (err) {
        await ctx.audit({
          module: 'Authentication', entityType: 'User', entityId: attempted, action: 'Failed Login',
          oldValue: { username: attempted, error: err.message }, performedBy: attempted || 'Guest'
        });
        throw err;
      }
    }
  },
  // Called when the web app loads: who is signed in in this browser (null when nobody).
  'auth:getCurrentUser': {
    public: true,
    optionalSession: true,
    handler: (ctx) => (ctx.user
      ? { user: ctx.user, loginTimestamp: ctx.session.createdAt, csrfToken: ctx.session.csrfToken }
      : null)
  },
  'auth:logout': {
    handler: async (ctx) => {
      await ctx.audit({ module: 'Authentication', entityType: 'User', entityId: username(ctx), action: 'Logout' });
      await ctx.signOut();
      return true;
    }
  },
  'auth:getSecurityStatus': {
    handler: (ctx) => ctx.s.auth.getSecurityStatus(ctx.user)
  },
  'auth:completeFirstLoginWizard': {
    roles: ADMIN,
    rateLimit: REAUTH_LIMIT,
    handler: async (ctx, data) => {
      const { result, user } = await ctx.s.auth.completeFirstLoginWizard(ctx.user.id, data || {});
      // New credentials: start a fresh session (the old one ended with the password change).
      await ctx.signIn(user);
      await ctx.audit({ module: 'Authentication', entityType: 'User', entityId: user.username, action: 'First Login Security Setup' });
      return result;
    }
  },
  'auth:changeUsername': {
    rateLimit: REAUTH_LIMIT,
    handler: async (ctx, { currentPassword, newUsername } = {}) => {
      const res = await ctx.s.auth.changeUsername(ctx.user.id, currentPassword, newUsername);
      await ctx.audit({
        module: 'Authentication', entityType: 'User', entityId: String(ctx.user.id), action: 'Username Change',
        oldValue: { username: ctx.user.username }, newValue: { username: res.username }
      });
      return res;
    }
  },
  'auth:changeRecoveryPassword': {
    roles: ADMIN,
    rateLimit: REAUTH_LIMIT,
    handler: async (ctx, { currentPassword, newPassword } = {}) => {
      const res = await ctx.s.recovery.changeRecoveryPassword(currentPassword, newPassword);
      await ctx.audit({ module: 'Authentication', entityType: 'Emergency Recovery', entityId: 'SYSTEM', action: 'Recovery Password Change' });
      return res;
    }
  },
  'auth:changeRecoveryPin': {
    roles: ADMIN,
    rateLimit: REAUTH_LIMIT,
    handler: async (ctx, { currentAuth, newPin } = {}) => {
      const res = await ctx.s.recovery.changeRecoveryPin(currentAuth, newPin);
      await ctx.audit({ module: 'Authentication', entityType: 'Emergency Recovery', entityId: 'SYSTEM', action: 'Recovery PIN Change' });
      return res;
    }
  },
  'auth:createUser': {
    roles: ADMIN,
    handler: async (ctx, payload) => {
      const res = await ctx.s.auth.createUser(payload || {});
      await ctx.audit({
        module: 'Authentication', entityType: 'User', entityId: res.username, action: 'Create User',
        newValue: { username: res.username, role: res.role }
      });
      return res;
    }
  },
  'auth:changePassword': {
    rateLimit: REAUTH_LIMIT,
    handler: async (ctx, { oldPassword, newPassword } = {}) => {
      const updated = await ctx.s.auth.changePassword(ctx.user.id, oldPassword, newPassword);
      // Every other browser signed in as this user is signed out; this one gets a new session.
      await ctx.signIn(updated);
      await ctx.audit({ module: 'Authentication', entityType: 'User', entityId: username(ctx), action: 'Password Change' });
      return true;
    }
  },
  'auth:resetPassword': {
    roles: ADMIN,
    handler: async (ctx, { username: target, newPassword } = {}) => {
      const updated = await ctx.s.auth.resetPassword(target, newPassword);
      if (updated.id === ctx.user.id) {
        await ctx.signIn(updated);
      } else {
        await deleteUserSessions(ctx.db, updated.id);
      }
      await ctx.audit({ module: 'Authentication', entityType: 'User', entityId: updated.username, action: 'Password Reset by Administrator' });
      return true;
    }
  },
  'auth:activateUser': {
    roles: ADMIN,
    handler: async (ctx, { username: target } = {}) => {
      const res = await ctx.s.auth.activateUser(target);
      await ctx.audit({ module: 'Authentication', entityType: 'User', entityId: String(target), action: 'User Enabled' });
      return res;
    }
  },
  'auth:disableUser': {
    roles: ADMIN,
    handler: async (ctx, { username: target } = {}) => {
      const user = await ctx.s.auth.disableUser(target);
      await deleteUserSessions(ctx.db, user.id);
      await ctx.audit({ module: 'Authentication', entityType: 'User', entityId: user.username, action: 'User Disabled' });
      return true;
    }
  },
  'auth:unlockUser': {
    roles: ADMIN,
    handler: async (ctx, { username: target } = {}) => {
      const user = await ctx.s.auth.unlockUser(target);
      await ctx.audit({ module: 'Authentication', entityType: 'User', entityId: user.username, action: 'Account Unlocked' });
      return true;
    }
  },
  'auth:getAllUsers': {
    roles: ADMIN,
    handler: (ctx) => ctx.s.auth.getAllUsers()
  },
  'auth:changeRole': {
    roles: ADMIN,
    handler: async (ctx, { username: target, role } = {}) => {
      const res = await ctx.s.auth.changeRole(target, role);
      await ctx.audit({ module: 'Authentication', entityType: 'User', entityId: String(target), action: 'Role Change', newValue: { role } });
      return res;
    }
  },
  'auth:deleteUser': {
    roles: ADMIN,
    handler: async (ctx, target) => {
      const targetUsername = target && typeof target === 'object' ? target.username : target;
      const res = await ctx.s.auth.deleteUser(targetUsername);
      await ctx.audit({ module: 'Authentication', entityType: 'User', entityId: String(targetUsername), action: 'Delete' });
      return res;
    }
  },

  // --- Backup history (the files themselves go through /api/backup, see http/backupRoutes.js) ---
  'backup:getHistory': {
    roles: ADMIN,
    handler: (ctx) => ctx.s.audit.findRecent({ module: 'Settings', entityType: 'Backup', limit: 50 })
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

  // --- Export Center (the files themselves are built by POST /api/export, see http/exportRoutes.js) ---
  'export:getPreviewData': {
    roles: MANAGERS,
    handler: (ctx, { reportType, filters } = {}) => ctx.s.exportData.fetchData(reportType, filters)
  },
  'export:getHistory': {
    roles: MANAGERS,
    handler: (ctx) => ctx.s.audit.findRecent({ module: 'Export Center', limit: 50 })
  }
};

module.exports = { handlers, createServices, ORDER_STATUS_ROLES };
