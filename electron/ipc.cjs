const { ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const logger = require('./logger.cjs');
const SessionManager = require('./auth/SessionManager.cjs');
const AuthenticationService = require('./auth/AuthenticationService.cjs');
const BackupService = require('./database/BackupService.cjs');
const UserDatabaseService = require('./auth/UserDatabaseService.cjs');

// Import Repositories
const ProductRepository = require('./database/ProductRepository.cjs');
const AreaRepository = require('./database/AreaRepository.cjs');
const DoctorRepository = require('./database/DoctorRepository.cjs');
const InstitutionRepository = require('./database/InstitutionRepository.cjs');
const TeamMemberRepository = require('./database/TeamMemberRepository.cjs');
const TargetRepository = require('./database/TargetRepository.cjs');
const OrderRepository = require('./database/OrderRepository.cjs');
const ReportRepository = require('./database/ReportRepository.cjs');
const SettingsRepository = require('./database/SettingsRepository.cjs');
const CategoryRepository = require('./database/CategoryRepository.cjs');
const BusinessYearRepository = require('./database/BusinessYearRepository.cjs');
const AuditRepository = require('./database/AuditRepository.cjs');
const ValidationService = require('./validation/ValidationService.cjs');
const AnalyticsService = require('./services/AnalyticsService.cjs');

function setupIpcHandlers(db) {
  logger.info('Setting up Electron IPC handlers...');

  const productRepo = new ProductRepository(db);
  const areaRepo = new AreaRepository(db);
  const doctorRepo = new DoctorRepository(db);
  const institutionRepo = new InstitutionRepository(db);
  const teamMemberRepo = new TeamMemberRepository(db);
  const targetRepo = new TargetRepository(db);
  const orderRepo = new OrderRepository(db);
  const reportRepo = new ReportRepository(db);
  const settingsRepo = new SettingsRepository(db);
  const categoryRepo = new CategoryRepository(db);
  const businessYearRepo = new BusinessYearRepository(db);
  const auditRepo = new AuditRepository(db);
  const validator = new ValidationService(db);

  const getCurrentUser = () => {
    const s = SessionManager.getSession();
    return s ? s.user.username : 'System';
  };

  function formatErrorMessage(error) {
    if (!error || !error.message) return 'An unexpected error occurred. Please try again.';
    const msg = error.message;

    if (msg.includes('UNIQUE constraint failed')) {
      if (msg.includes('product_code') || msg.includes('products.code')) {
        return 'This Product Code already exists. Please use a unique Product Code.';
      }
      if (msg.includes('doctor_code') || msg.includes('doctors.code')) {
        return 'This Doctor Code already exists. Please use a unique Doctor Code.';
      }
      if (msg.includes('institution_code') || msg.includes('institutions.code')) {
        return 'This Institution Code already exists. Please use a unique Institution Code.';
      }
      if (msg.includes('area_code') || msg.includes('areas.code')) {
        return 'This Area Code already exists. Please use a unique Area Code.';
      }
      if (msg.includes('employee_id') || msg.includes('team_members.code')) {
        return 'This Employee ID already exists. Please use a unique Employee ID.';
      }
      if (msg.includes('name')) {
        return 'A record with this name already exists.';
      }
      return 'This record already exists in the system.';
    }

    if (msg.includes('FOREIGN KEY constraint failed')) {
      return 'Cannot complete operation because this record is referenced by active sales, orders, or other entities.';
    }

    if (msg.includes('no such table')) {
      return 'The system database is unavailable. Please contact the Administrator.';
    }

    if (msg.includes('SQLITE_READONLY') || msg.includes('database is locked')) {
      return 'The database file is currently locked or read-only. Please restart the application.';
    }

    return msg;
  }

  function wrapHandler(channel, handlerFn, options = {}) {
    ipcMain.handle(channel, async (event, ...args) => {
      try {
        logger.info(`IPC Request: ${channel}`);
        
        // 1. Verify session unless bypassed
        if (!options.isPublic) {
          SessionManager.validateSession();
        }

        // 2. Verify roles if specified
        if (options.allowedRoles) {
          const session = SessionManager.getSession();
          if (!session || !options.allowedRoles.includes(session.user.role)) {
            throw new Error(`Unauthorized: Role '${session?.user?.role || 'Guest'}' does not have permission to access ${channel}`);
          }
        }

        const res = options.passEvent
          ? await handlerFn(event, ...args)
          : await handlerFn(...args);
        return { success: true, data: res };
      } catch (error) {
        logger.error(`IPC Error on ${channel}:`, error);
        return { success: false, error: formatErrorMessage(error) };
      }
    });
  }

  // --- Categories ---
  wrapHandler('categories:getAll', () => categoryRepo.findAll());
  wrapHandler('categories:getById', (id) => categoryRepo.findById(id));
  wrapHandler('categories:save', (c) => {
    const user = getCurrentUser();
    const oldVal = c.id ? categoryRepo.findById(c.id) : null;
    const res = c.id ? categoryRepo.update(c.id, c) : categoryRepo.create(c);
    auditRepo.logAction({
      module: 'Groups',
      entityType: 'Group',
      entityId: res.id,
      action: c.id ? 'Update' : 'Create',
      oldValue: oldVal,
      newValue: res,
      performedBy: user
    });
    return res;
  });
  wrapHandler('categories:delete', (id) => {
    const user = getCurrentUser();
    const oldVal = categoryRepo.findById(id);
    const res = categoryRepo.delete(id);
    if (res) {
      auditRepo.logAction({
        module: 'Groups',
        entityType: 'Group',
        entityId: id,
        action: 'Delete',
        oldValue: oldVal,
        performedBy: user
      });
    }
    return res;
  });
  wrapHandler('divisions:getAll', () => db.prepare('SELECT * FROM divisions ORDER BY name ASC').all());

  // --- App Config ---
  wrapHandler('app:getConfig', () => {
    const config = require('./config.cjs');
    return {
      mode: config.mode,
      version: config.version,
      dbVersion: config.dbVersion
    };
  }, { isPublic: true });

  // --- Products ---
  wrapHandler('products:getAll', () => productRepo.findAll());
  wrapHandler('products:getById', (id) => productRepo.findById(id));
  wrapHandler('products:save', (p) => {
    const user = getCurrentUser();
    const clean = validator.sanitize(p);
    validator.validate('Products', 'Save Product', () => validator.product.validateSave(clean));
    const oldVal = clean.id ? productRepo.findById(clean.id) : null;
    const res = clean.id ? productRepo.update(clean.id, clean) : productRepo.create(clean);

    let actionName = 'Create';
    if (clean.id) {
      actionName = (oldVal && oldVal.status !== res.status) ? 'Status Change' : 'Edit';
    }

    auditRepo.logAction({
      module: 'Products',
      entityType: 'Product',
      entityId: res.id,
      action: actionName,
      oldValue: oldVal,
      newValue: res,
      performedBy: user
    });
    return res;
  });
  wrapHandler('products:delete', (id) => {
    const user = getCurrentUser();
    const oldVal = productRepo.findById(id);
    try {
      validator.validate('Products', 'Delete Product', () => validator.product.validateDelete(id));
      const res = productRepo.delete(id);
      auditRepo.logAction({
        module: 'Products',
        entityType: 'Product',
        entityId: id,
        action: 'Delete Success',
        oldValue: oldVal,
        performedBy: user
      });
      return res;
    } catch (err) {
      auditRepo.logAction({
        module: 'Products',
        entityType: 'Product',
        entityId: id,
        action: 'Delete Attempt',
        oldValue: oldVal,
        newValue: { error: err.message },
        performedBy: user
      });
      throw err;
    }
  });

  // --- Areas ---
  wrapHandler('areas:getAll', () => areaRepo.findAll());
  wrapHandler('areas:getById', (id) => areaRepo.findById(id));
  wrapHandler('areas:save', (a) => {
    const user = getCurrentUser();
    const clean = validator.sanitize(a);
    validator.validate('Areas', 'Save Area', () => validator.area.validateSave(clean));
    const oldVal = clean.id ? areaRepo.findById(clean.id) : null;
    const res = clean.id ? areaRepo.update(clean.id, clean) : areaRepo.create(clean);
    auditRepo.logAction({
      module: 'Areas',
      entityType: 'Area',
      entityId: res.id,
      action: clean.id ? 'Update' : 'Create',
      oldValue: oldVal,
      newValue: res,
      performedBy: user
    });
    return res;
  });
  wrapHandler('areas:delete', (id) => {
    const user = getCurrentUser();
    const oldVal = areaRepo.findById(id);
    validator.validate('Areas', 'Delete Area', () => validator.area.validateDelete(id));
    const res = areaRepo.delete(id);
    auditRepo.logAction({
      module: 'Areas',
      entityType: 'Area',
      entityId: id,
      action: 'Delete',
      oldValue: oldVal,
      performedBy: user
    });
    return res;
  });

  // --- Doctors ---
  wrapHandler('doctors:getAll', () => doctorRepo.findAll());
  wrapHandler('doctors:getById', (id) => doctorRepo.findById(id));
  wrapHandler('doctors:save', (d) => {
    const user = getCurrentUser();
    const clean = validator.sanitize(d);
    validator.validate('Doctors', 'Save Doctor', () => validator.doctor.validateSave(clean));
    const oldVal = clean.id ? doctorRepo.findById(clean.id) : null;
    const res = clean.id ? doctorRepo.update(clean.id, clean) : doctorRepo.create(clean);
    auditRepo.logAction({
      module: 'Doctors',
      entityType: 'Doctor',
      entityId: res.id,
      action: clean.id ? 'Update' : 'Create',
      oldValue: oldVal,
      newValue: res,
      performedBy: user
    });
    return res;
  });
  wrapHandler('doctors:delete', (id) => {
    const user = getCurrentUser();
    const oldVal = doctorRepo.findById(id);
    validator.validate('Doctors', 'Delete Doctor', () => validator.doctor.validateDelete(id));
    const res = doctorRepo.delete(id);
    auditRepo.logAction({
      module: 'Doctors',
      entityType: 'Doctor',
      entityId: id,
      action: 'Delete',
      oldValue: oldVal,
      performedBy: user
    });
    return res;
  });

  // --- Institutions ---
  wrapHandler('institutions:getAll', () => institutionRepo.findAll());
  wrapHandler('institutions:getById', (id) => institutionRepo.findById(id));
  wrapHandler('institutions:save', (inst) => {
    const user = getCurrentUser();
    const clean = validator.sanitize(inst);
    validator.validate('Institutions', 'Save Institution', () => validator.institution.validateSave(clean));
    const oldVal = clean.id ? institutionRepo.findById(clean.id) : null;
    const res = clean.id ? institutionRepo.update(clean.id, clean) : institutionRepo.create(clean);
    auditRepo.logAction({
      module: 'Institutions',
      entityType: 'Institution',
      entityId: res.id,
      action: clean.id ? 'Update' : 'Create',
      oldValue: oldVal,
      newValue: res,
      performedBy: user
    });
    return res;
  });
  wrapHandler('institutions:delete', (id) => {
    const user = getCurrentUser();
    const oldVal = institutionRepo.findById(id);
    validator.validate('Institutions', 'Delete Institution', () => validator.institution.validateDelete(id));
    const res = institutionRepo.delete(id);
    auditRepo.logAction({
      module: 'Institutions',
      entityType: 'Institution',
      entityId: id,
      action: 'Delete',
      oldValue: oldVal,
      performedBy: user
    });
    return res;
  });

  // --- Team Members ---
  wrapHandler('teamMembers:getAll', () => teamMemberRepo.findAll());
  wrapHandler('teamMembers:getById', (id) => teamMemberRepo.findById(id));
  wrapHandler('teamMembers:save', (tm) => {
    const user = getCurrentUser();
    const clean = validator.sanitize(tm);
    validator.validate('TeamMembers', 'Save Team Member', () => validator.teamMember.validateSave(clean));
    const oldVal = clean.id ? teamMemberRepo.findById(clean.id) : null;
    const res = clean.id ? teamMemberRepo.update(clean.id, clean) : teamMemberRepo.create(clean);
    auditRepo.logAction({
      module: 'Team Members',
      entityType: 'TeamMember',
      entityId: res.id,
      action: clean.id ? 'Update' : 'Create',
      oldValue: oldVal,
      newValue: res,
      performedBy: user
    });
    return res;
  });
  wrapHandler('teamMembers:delete', (id) => {
    const user = getCurrentUser();
    const oldVal = teamMemberRepo.findById(id);
    validator.validate('TeamMembers', 'Delete Team Member', () => validator.teamMember.validateDelete(id));
    const res = teamMemberRepo.delete(id);
    auditRepo.logAction({
      module: 'Team Members',
      entityType: 'TeamMember',
      entityId: id,
      action: 'Delete',
      oldValue: oldVal,
      performedBy: user
    });
    return res;
  });

  // --- Targets ---
  wrapHandler('targets:getAll', () => targetRepo.findAll());
  wrapHandler('targets:getById', (id) => targetRepo.findById(id));
  wrapHandler('targets:save', (t) => {
    const user = getCurrentUser();
    const clean = validator.sanitize(t);
    validator.validate('Targets', 'Save Target', () => validator.target.validateSave(clean));
    const oldVal = clean.id ? targetRepo.findById(clean.id) : null;
    const res = clean.id ? targetRepo.update(clean.id, clean) : targetRepo.create(clean);
    auditRepo.logAction({
      module: 'Targets',
      entityType: 'Target',
      entityId: res.id,
      action: clean.id ? 'Update' : 'Create',
      oldValue: oldVal,
      newValue: res,
      performedBy: user
    });
    return res;
  });
  wrapHandler('targets:delete', (id) => {
    const user = getCurrentUser();
    const oldVal = targetRepo.findById(id);
    validator.validate('Targets', 'Delete Target', () => validator.target.validateDelete(id));
    const res = targetRepo.delete(id);
    auditRepo.logAction({
      module: 'Targets',
      entityType: 'Target',
      entityId: id,
      action: 'Delete',
      oldValue: oldVal,
      performedBy: user
    });
    return res;
  });
  wrapHandler('targets:getActiveBusinessYears', () => targetRepo.getActiveBusinessYears());

  // --- Orders ---
  wrapHandler('orders:getAll', () => orderRepo.findAll());
  wrapHandler('orders:getById', (id) => orderRepo.findById(id));
  wrapHandler('orders:save', (o) => {
    const clean = validator.sanitize(o);
    const session = SessionManager.getSession();
    const role = session ? session.user.role : 'Admin';
    const username = session ? session.user.username : 'Admin';
    const oldVal = clean.id ? orderRepo.findById(clean.id) : null;

    try {
      validator.validate('Orders', 'Save Order', () => validator.order.validateSave(clean, role));
    } catch (err) {
      if (oldVal && ['Completed', 'Cancelled'].includes(oldVal.status)) {
        auditRepo.logAction({
          module: 'Orders',
          entityType: 'Order',
          entityId: clean.id,
          action: 'Edit Attempt on Locked Order',
          oldValue: oldVal,
          newValue: clean,
          performedBy: username
        });
      }
      throw err;
    }

    let recalculatedTotal = 0;
    let hasPriceOverride = false;
    const itemsList = clean.items || clean.products || [];

    itemsList.forEach(item => {
      const qty = Number(item.quantity || item.qty || 1);
      const rate = Number(item.unitPrice !== undefined ? item.unitPrice : (item.rate || 0));
      item.quantity = qty;
      item.unitPrice = rate;
      item.totalPrice = qty * rate;
      recalculatedTotal += item.totalPrice;

      if (item.productId) {
        const p = productRepo.findById(item.productId);
        if (p && p.tp !== undefined && Number(p.tp) !== rate) {
          hasPriceOverride = true;
        }
      }
    });

    clean.items = itemsList;
    clean.totalAmount = recalculatedTotal;
    clean.status = clean.status || 'Pending';

    const res = clean.id ? orderRepo.update(clean.id, clean) : orderRepo.create(clean, username);
    
    auditRepo.logAction({
      module: 'Orders',
      entityType: 'Order',
      entityId: res.id,
      action: clean.id ? 'Order Edited' : 'Order Created',
      oldValue: oldVal,
      newValue: res,
      performedBy: username
    });

    if (hasPriceOverride) {
      auditRepo.logAction({
        module: 'Orders',
        entityType: 'Order',
        entityId: res.id,
        action: 'Price Override',
        oldValue: null,
        newValue: { orderNumber: res.orderNumber, items: res.items },
        performedBy: username
      });
    }

    return res;
  });

  wrapHandler('orders:changeStatus', (id, newStatus, reason = '') => {
    const session = SessionManager.getSession();
    const role = session ? session.user.role : 'Admin';
    const username = session ? session.user.username : 'Admin';

    const currentOrder = orderRepo.findById(id);
    if (!currentOrder) {
      throw new Error(`Order with ID ${id} not found.`);
    }

    validator.validate('Orders', 'Change Status', () => 
      validator.order.validateStatusTransition(currentOrder.status, newStatus, role, reason)
    );

    const res = orderRepo.changeStatus(id, newStatus, reason, username);

    let actionName = 'Status Changed';
    if (newStatus === 'Completed') actionName = 'Sale Completed';
    else if (newStatus === 'Cancelled') actionName = 'Sale Cancelled';

    auditRepo.logAction({
      module: 'Orders',
      entityType: 'Order',
      entityId: id,
      action: actionName,
      oldValue: currentOrder,
      newValue: res,
      performedBy: username
    });

    return res;
  });

  wrapHandler('orders:delete', (id) => {
    const session = SessionManager.getSession();
    const role = session ? session.user.role : 'Admin';
    const username = session ? session.user.username : 'Admin';
    const oldVal = orderRepo.findById(id);

    try {
      validator.validate('Orders', 'Delete Order', () => validator.order.validateDelete(id, role));
      const res = orderRepo.delete(id);
      auditRepo.logAction({
        module: 'Orders',
        entityType: 'Order',
        entityId: id,
        action: 'Order Deleted',
        oldValue: oldVal,
        newValue: null,
        performedBy: username
      });
      return res;
    } catch (err) {
      auditRepo.logAction({
        module: 'Orders',
        entityType: 'Order',
        entityId: id,
        action: 'Delete Attempt',
        oldValue: oldVal,
        newValue: { error: err.message },
        performedBy: username
      });
      throw err;
    }
  });

  // --- Settings ---
  wrapHandler('settings:getAll', () => settingsRepo.findAll());
  wrapHandler('settings:save', (key, value, groupName) => {
    const user = getCurrentUser();
    const oldVal = settingsRepo.findByKey(key);
    const res = settingsRepo.save(key, value, groupName);

    let actionName = 'Update Setting';
    if (key === 'active_business_year' || key === 'business_year') {
      actionName = 'Business Year Change';
    } else if (key === 'production_mode' || key === 'mode') {
      actionName = 'Production Mode Change';
    }

    auditRepo.logAction({
      module: 'Settings',
      entityType: 'Setting',
      entityId: key,
      action: actionName,
      oldValue: { key, value: oldVal },
      newValue: { key, value },
      performedBy: user
    });
    return res;
  });
  wrapHandler('settings:getByKey', (key) => {
    const val = settingsRepo.findByKey(key);
    return val ? { value: val } : null;
  });

  // --- Reports & Dashboard ---
  wrapHandler('reports:getDashboardSummaryData', (filters) => reportRepo.getDashboardSummaryData(filters));
  wrapHandler('reports:getSalesTrendData', (filters) => reportRepo.getSalesTrendData(filters));
  wrapHandler('reports:getTargetAchievementData', (filters) => reportRepo.getTargetAchievementData(filters));
  wrapHandler('reports:getTeamContributionData', (filters) => reportRepo.getTeamContributionData(filters));
  wrapHandler('reports:getProductPerformanceData', (filters) => reportRepo.getProductPerformanceData(filters));
  wrapHandler('reports:getReportsData', (filters) => reportRepo.getReportsData(filters));

  // --- Tasks ---
  wrapHandler('tasks:getAll', () => {
    return db.prepare('SELECT id, text, is_done AS done FROM tasks ORDER BY id ASC').all();
  });
  wrapHandler('tasks:save', (task) => {
    if (task.id) {
      db.prepare('UPDATE tasks SET text = ?, is_done = ? WHERE id = ?').run(task.text, task.done ? 1 : 0, task.id);
      return task;
    } else {
      const res = db.prepare('INSERT INTO tasks (text, is_done) VALUES (?, ?)').run(task.text, task.done ? 1 : 0);
      return { id: res.lastInsertRowid, text: task.text, done: task.done };
    }
  });
  wrapHandler('tasks:delete', (id) => {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return true;
  });

  // --- Reminders ---
  wrapHandler('reminders:getAll', () => {
    return db.prepare('SELECT id, title, reminder_time AS time, type FROM reminders ORDER BY id ASC').all();
  });
  wrapHandler('reminders:save', (reminder) => {
    if (reminder.id) {
      db.prepare('UPDATE reminders SET title = ?, reminder_time = ?, type = ? WHERE id = ?')
        .run(reminder.title, reminder.time, reminder.type, reminder.id);
      return reminder;
    } else {
      const res = db.prepare('INSERT INTO reminders (title, reminder_time, type) VALUES (?, ?, ?)')
        .run(reminder.title, reminder.time, reminder.type);
      return { id: res.lastInsertRowid, title: reminder.title, time: reminder.time, type: reminder.type };
    }
  });
  wrapHandler('reminders:delete', (id) => {
    db.prepare('DELETE FROM reminders WHERE id = ?').run(id);
    return true;
  });

  // --- Authentication ---
  const RecoveryService = require('./auth/RecoveryService.cjs');

  wrapHandler('auth:recoveryVerifyPassword', (password) => {
    return RecoveryService.verifyRecoveryPassword(password);
  }, { isPublic: true });

  wrapHandler('auth:recoveryGetUsers', () => {
    return RecoveryService.getAllUsers();
  }, { isPublic: true });

  wrapHandler('auth:recoveryToggleUserStatus', (data) => {
    return RecoveryService.toggleUserStatus(data);
  }, { isPublic: true });

  wrapHandler('auth:recoveryResetUserPassword', (data) => {
    return RecoveryService.resetUserPassword(data);
  }, { isPublic: true });

  wrapHandler('auth:getSecurityStatus', async () => {
    return AuthenticationService.getSecurityStatus();
  }, { isPublic: true });

  wrapHandler('auth:completeFirstLoginWizard', async (data) => {
    return AuthenticationService.completeFirstLoginWizard(data);
  }, { isPublic: true });

  wrapHandler('auth:changeUsername', async ({ currentPassword, newUsername }) => {
    const session = SessionManager.getSession();
    if (!session) throw new Error('Unauthorized');
    return AuthenticationService.changeUsername(session.user.id, currentPassword, newUsername);
  });

  wrapHandler('auth:changeRecoveryPassword', async ({ currentPassword, newPassword }) => {
    return RecoveryService.changeRecoveryPassword(currentPassword, newPassword);
  });

  wrapHandler('auth:verifyRecoveryPin', async ({ pin }) => {
    return RecoveryService.verifyRecoveryPin(pin);
  }, { isPublic: true });

  wrapHandler('auth:changeRecoveryPin', async ({ currentAuth, newPin }) => {
    return RecoveryService.changeRecoveryPin(currentAuth, newPin);
  });

  wrapHandler('auth:resetRecoveryPasswordWithPin', async ({ pin, newPassword }) => {
    return RecoveryService.resetRecoveryPasswordWithPin(pin, newPassword);
  }, { isPublic: true });

  wrapHandler('auth:login', async ({ username, password }) => {
    try {
      const res = await AuthenticationService.authenticateUser(username, password);
      auditRepo.logAction({
        module: 'Authentication',
        entityType: 'User',
        entityId: username,
        action: 'Login',
        newValue: { username, role: res.role },
        performedBy: username
      });
      return res;
    } catch (err) {
      auditRepo.logAction({
        module: 'Authentication',
        entityType: 'User',
        entityId: username,
        action: 'Failed Login',
        oldValue: { username, error: err.message },
        performedBy: username || 'Guest'
      });
      throw err;
    }
  }, { isPublic: true });

  wrapHandler('auth:logout', async () => {
    const session = SessionManager.getSession();
    const username = session ? session.user.username : 'User';
    SessionManager.endSession();
    auditRepo.logAction({
      module: 'Authentication',
      entityType: 'User',
      entityId: username,
      action: 'Logout',
      performedBy: username
    });
    return true;
  });

  wrapHandler('auth:getCurrentUser', async () => {
    return SessionManager.getSession();
  }, { isPublic: true });

  wrapHandler('auth:createUser', async (payload) => {
    const userRepo = AuthenticationService.getRepository();
    const countStmt = userRepo.db.prepare('SELECT COUNT(*) as count FROM users');
    const { count } = countStmt.get();
    
    if (count > 0) {
      SessionManager.validateSession();
      const session = SessionManager.getSession();
      if (session.user.role !== 'Admin') {
        throw new Error('Unauthorized: Only Admin users can create accounts.');
      }
    }
    
    const res = await AuthenticationService.createUser(payload);
    auditRepo.logAction({
      module: 'Authentication',
      entityType: 'User',
      entityId: payload.username,
      action: 'Create User',
      newValue: { username: payload.username, role: payload.role },
      performedBy: getCurrentUser()
    });
    return res;
  }, { isPublic: true });

  wrapHandler('auth:changePassword', async ({ oldPassword, newPassword }) => {
    const session = SessionManager.getSession();
    if (!session) throw new Error('Unauthorized');
    const res = await AuthenticationService.changePassword(session.user.id, oldPassword, newPassword);
    auditRepo.logAction({
      module: 'Authentication',
      entityType: 'User',
      entityId: session.user.username,
      action: 'Password Change',
      performedBy: session.user.username
    });
    return res;
  });

  wrapHandler('auth:resetPassword', async ({ username, newPassword }) => {
    const res = await AuthenticationService.resetPassword(username, newPassword);
    auditRepo.logAction({
      module: 'Authentication',
      entityType: 'User',
      entityId: username,
      action: 'Password Change',
      performedBy: getCurrentUser()
    });
    return res;
  }, { allowedRoles: ['Admin'] });

  wrapHandler('auth:activateUser', async ({ username }) => {
    return AuthenticationService.activateUser(username);
  }, { allowedRoles: ['Admin'] });

  wrapHandler('auth:disableUser', async ({ username }) => {
    return AuthenticationService.disableUser(username);
  }, { allowedRoles: ['Admin'] });

  wrapHandler('auth:getAllUsers', async () => {
    return AuthenticationService.getAllUsers();
  }, { allowedRoles: ['Admin'] });

  wrapHandler('auth:changeRole', async ({ username, role }) => {
    return AuthenticationService.changeRole(username, role);
  }, { allowedRoles: ['Admin'] });

  wrapHandler('auth:deleteUser', async (username) => {
    const targetUsername = typeof username === 'object' ? username.username : username;
    const res = AuthenticationService.deleteUser(targetUsername);
    auditRepo.logAction({
      module: 'Authentication',
      entityType: 'User',
      entityId: targetUsername,
      action: 'Delete',
      performedBy: getCurrentUser()
    });
    return res;
  }, { allowedRoles: ['Admin'] });

  // --- Production and Backup Management ---
  wrapHandler('backup:create', async () => {
    const user = getCurrentUser();
    const res = await BackupService.createBackup();
    auditRepo.logAction({
      module: 'Settings',
      entityType: 'Backup',
      entityId: res.fileName,
      action: 'Backup',
      newValue: res,
      performedBy: user
    });
    return res;
  });

  wrapHandler('backup:restore', async (backupPath) => {
    const user = getCurrentUser();
    const res = await BackupService.restoreBackup(backupPath);
    auditRepo.logAction({
      module: 'Settings',
      entityType: 'Backup',
      entityId: path.basename(backupPath),
      action: 'Restore',
      newValue: { backupPath, success: true },
      performedBy: user
    });
    return res;
  });

  // --- Audit Logs ---
  wrapHandler('auditLogs:getAll', (filters) => auditRepo.findAll(filters), { allowedRoles: ['Admin'] });
  wrapHandler('auditLogs:getById', (id) => auditRepo.getById(id), { allowedRoles: ['Admin'] });

  wrapHandler('backup:getHistory', async () => {
    const storageDir = UserDatabaseService.getStorageDirectory();
    const backupDir = path.join(storageDir, 'Backups');
    if (!fs.existsSync(backupDir)) {
      return [];
    }
    const files = fs.readdirSync(backupDir).filter(f => f.startsWith('backup_') && f.endsWith('.db'));
    const history = files.map(file => {
      const filePath = path.join(backupDir, file);
      const stat = fs.statSync(filePath);
      return {
        fileName: file,
        filePath,
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString()
      };
    });
    return history.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
  });

  wrapHandler('integrity:check', async () => {
    return BackupService.runIntegrityCheck();
  });

  wrapHandler('diagnostics:get', async () => {
    return BackupService.getDiagnostics();
  }, { allowedRoles: ['Admin'] });

  wrapHandler('dialog:selectFolder', async () => {
    const res = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    });
    if (!res.canceled && res.filePaths.length > 0) {
      return res.filePaths[0];
    }
    return null;
  });

  wrapHandler('dialog:selectFile', async () => {
    const res = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }]
    });
    if (!res.canceled && res.filePaths.length > 0) {
      return res.filePaths[0];
    }
    return null;
  });

  // --- Global Search ---
  const SearchService = require('./database/SearchService.cjs');
  wrapHandler('search:global', (query) => SearchService.globalSearch(query));

  // --- Analytics & Reporting ---
  wrapHandler('analytics:getDashboardSummary', () => AnalyticsService.getDashboardSummary());

  // --- Export Center (Excel, PDF, PowerPoint) ---
  const ExportRepository = require('./database/ExportRepository.cjs');

  wrapHandler('export:generate', async ({ reportType, format, filters }) => {
    const user = getCurrentUser();
    const exportRepo = new ExportRepository(db, auditRepo);

    const safeType = (reportType || 'Report').replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const fmtClean = (format || 'excel').toLowerCase().replace('.', '');

    let ext = 'xlsx';
    let filterName = 'Excel Spreadsheet';
    if (fmtClean === 'pdf') {
      ext = 'pdf';
      filterName = 'PDF Document';
    } else if (fmtClean === 'pptx' || fmtClean === 'powerpoint') {
      ext = 'pptx';
      filterName = 'PowerPoint Presentation';
    }

    const defaultName = `Himmel_${safeType}_${dateStr}.${ext}`;

    const saveDialogResult = await dialog.showSaveDialog({
      title: `Save ${reportType} Export File`,
      defaultPath: defaultName,
      filters: [{ name: filterName, extensions: [ext] }]
    });

    if (saveDialogResult.canceled || !saveDialogResult.filePath) {
      return { success: false, canceled: true, error: 'Export canceled by user.' };
    }

    return exportRepo.generateExport({
      reportType,
      format: fmtClean,
      filters,
      targetFilePath: saveDialogResult.filePath,
      user
    });
  });

  wrapHandler('export:getHistory', async () => {
    const exportRepo = new ExportRepository(db, auditRepo);
    return exportRepo.getExportHistory();
  });

  wrapHandler('export:getPreviewData', async ({ reportType, filters }) => {
    const exportRepo = new ExportRepository(db, auditRepo);
    return exportRepo.fetchData(reportType, filters);
  });

  wrapHandler('export:openFile', async (filePath) => {
    const { shell } = require('electron');
    if (filePath && fs.existsSync(filePath)) {
      await shell.openPath(filePath);
      return true;
    }
    throw new Error('File does not exist on disk.');
  });
  wrapHandler('analytics:getMonthlySales', () => AnalyticsService.getMonthlySales());
  wrapHandler('analytics:getTopProducts', () => AnalyticsService.getTopProducts());
  wrapHandler('analytics:getAreaPerformance', () => AnalyticsService.getAreaPerformance());
  wrapHandler('analytics:getRepresentativePerformance', () => AnalyticsService.getRepresentativePerformance());
  wrapHandler('analytics:getTargetProgress', () => AnalyticsService.getTargetProgress());
  wrapHandler('analytics:getRecentOrders', () => AnalyticsService.getRecentOrders());

  wrapHandler('system:check-first-run', async () => {
    const StartupValidator = require('./system/StartupValidator.cjs');
    return StartupValidator.isFirstRun();
  }, { isPublic: true });

  wrapHandler('system:start-initialization', async (event) => {
    const SystemInitializer = require('./system/SystemInitializer.cjs');
    return SystemInitializer.initializeSystem(null, (progress) => {
      if (event && event.sender && typeof event.sender.send === 'function') {
        event.sender.send('system:init-progress', progress);
      }
    });
  }, { isPublic: true, passEvent: true });

  wrapHandler('system:validate-startup', async () => {
    const StartupValidator = require('./system/StartupValidator.cjs');
    return StartupValidator.validateStartup();
  }, { isPublic: true });

  wrapHandler('system:open-log-folder', async () => {
    const { shell } = require('electron');
    const storageDir = UserDatabaseService.getStorageDirectory();
    const logDir = path.join(storageDir, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    await shell.openPath(logDir);
    return true;
  }, { isPublic: true });

  wrapHandler('system:exit-app', async () => {
    const { app } = require('electron');
    logger.info('[Startup] system:exit-app requested by renderer');
    app.quit();
    return true;
  }, { isPublic: true });

  // --- Enterprise Auto Update IPC Handlers ---
  const UpdateManager = require('./system/UpdateManager.cjs');
  UpdateManager.subscribe((statusData) => {
    const { BrowserWindow } = require('electron');
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) {
        win.webContents.send('updater:status-changed', statusData);
      }
    });
  });

  wrapHandler('updater:check', (isSilent) => UpdateManager.checkForUpdates(isSilent), { isPublic: true });
  wrapHandler('updater:download', () => UpdateManager.downloadUpdate(), { isPublic: true });
  wrapHandler('updater:install', () => UpdateManager.quitAndInstall(), { isPublic: true });
  wrapHandler('updater:cancel', () => UpdateManager.cancelDownload(), { isPublic: true });
  wrapHandler('updater:getStatus', () => UpdateManager.getStatus(), { isPublic: true });
  wrapHandler('updater:getVersionHistory', () => UpdateManager.getVersionHistory(), { isPublic: true });

  logger.info('Electron IPC handlers successfully registered.');
  logger.info('Checkpoint: IPC handlers register');
}

module.exports = { setupIpcHandlers };
