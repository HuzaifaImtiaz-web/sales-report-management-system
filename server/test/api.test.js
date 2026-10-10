// End-to-end API tests: real server + real PostgreSQL (PGlite in memory) over HTTP.
// Run with: npm test
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { PGlite } = require('@electric-sql/pglite');
const { PGLiteSocketServer } = require('@electric-sql/pglite-socket');

const ADMIN_PASSWORD = 'AdminPass#2026';
let pglite;
let socketServer;
let httpServer;
let baseUrl;
let closeDb;

async function call(channel, args = [], { token, recoveryToken } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (recoveryToken) headers['X-Recovery-Token'] = recoveryToken;
  const res = await fetch(`${baseUrl}/api/rpc/${encodeURIComponent(channel)}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ args })
  });
  const body = await res.json();
  return { status: res.status, ...body };
}

async function ok(channel, args, opts) {
  const res = await call(channel, args, opts);
  assert.equal(res.success, true, `${channel} failed: ${res.error}`);
  return res.data;
}

async function login(username, password) {
  const data = await ok('auth:login', [{ username, password }]);
  return data.token;
}

const state = {};

before(async () => {
  pglite = await PGlite.create();
  socketServer = new PGLiteSocketServer({ db: pglite, port: 0, host: '127.0.0.1', maxConnections: 10 });
  await socketServer.start();
  const dbPort = socketServer.server.address().port;

  process.env.DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:${dbPort}/postgres`;
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
  process.env.TRUST_PROXY = '0';

  const { start } = require('../src/index');
  closeDb = require('../src/db').closeDb;
  const started = await start({ port: 0, host: '127.0.0.1' });
  httpServer = started.server;
  baseUrl = `http://127.0.0.1:${httpServer.address().port}`;
});

after(async () => {
  if (httpServer) await new Promise((resolve) => httpServer.close(resolve));
  if (closeDb) await closeDb();
  if (socketServer) await socketServer.stop();
  if (pglite) await pglite.close();
});

test('health endpoint reports the database is reachable', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, 'ok');
});

test('requests without a login token are rejected as an expired session', async () => {
  const res = await call('products:getAll');
  assert.equal(res.status, 401);
  assert.match(res.error, /Session expired/);
});

test('unknown channels return 404', async () => {
  const res = await call('nope:nothing');
  assert.equal(res.status, 404);
});

test('login: wrong password, then the seeded administrator', async () => {
  const bad = await call('auth:login', [{ username: 'admin', password: 'wrong-password' }]);
  assert.equal(bad.success, false);
  assert.equal(bad.error, 'Invalid username or password.');

  const unknown = await call('auth:login', [{ username: 'ghost', password: 'whatever123' }]);
  assert.equal(unknown.error, 'Invalid username or password.');

  const data = await ok('auth:login', [{ username: 'ADMIN', password: ADMIN_PASSWORD }]);
  assert.ok(data.token);
  assert.equal(data.session.user.username, 'admin');
  assert.equal(data.session.user.role, 'Admin');
  state.admin = data.token;
});

test('administrator creates a manager and a sales rep that share the same data', async () => {
  const manager = await ok('auth:createUser', [{ username: 'maria', password: 'Manager#2026', fullName: 'Maria Manager', role: 'Manager' }], { token: state.admin });
  assert.equal(manager.role, 'Manager');
  await ok('auth:createUser', [{ username: 'rafay', password: 'RepPass#2026', fullName: 'Rafay Rep', role: 'Sales Representative' }], { token: state.admin });

  const dup = await call('auth:createUser', [{ username: 'RAFAY', password: 'RepPass#2026', fullName: 'Dup', role: 'Rep' }], { token: state.admin });
  assert.match(dup.error, /already exists/);

  state.manager = await login('maria', 'Manager#2026');
  state.rep = await login('rafay', 'RepPass#2026');

  const users = await ok('auth:getAllUsers', [], { token: state.admin });
  assert.deepEqual(users.map((u) => u.username).sort(), ['admin', 'maria', 'rafay']);
});

test('reference data was seeded', async () => {
  const divisions = await ok('divisions:getAll', [], { token: state.rep });
  assert.deepEqual(divisions.map((d) => d.name), ['Cardiology', 'Oncology']);
  const groups = await ok('categories:getAll', [], { token: state.rep });
  assert.equal(groups.length, 9);
  const years = await ok('targets:getActiveBusinessYears', [], { token: state.rep });
  assert.equal(years[0].value, '2026-2027');
});

test('master data: create, read, update with validation and audit', async () => {
  const area = await ok('areas:save', [{ name: 'Lahore Gulberg', city: 'Lahore', description: 'Main zone' }], { token: state.manager });
  assert.equal(area.status, 'Active');
  state.areaId = area.id;

  const dupArea = await call('areas:save', [{ name: 'lahore gulberg', city: 'LAHORE' }], { token: state.manager });
  assert.equal(dupArea.error, 'Area with this Name and City already exists.');

  // Area given by name is created automatically (DoctorValidator behaviour).
  const doctor = await ok('doctors:save', [{ name: 'Dr. Ayesha Khan', specialty: 'Cardiologist', hospital: 'Mayo Hospital', area: 'Karachi Clifton' }], { token: state.manager });
  assert.equal(doctor.areaName, 'Karachi Clifton');
  state.doctorId = doctor.id;

  const dupDoctor = await call('doctors:save', [{ name: 'dr. ayesha khan', hospital: 'MAYO HOSPITAL', areaId: doctor.areaId }], { token: state.manager });
  assert.equal(dupDoctor.error, 'Doctor already exists.');

  const inst = await ok('institutions:save', [{ name: 'Mayo Hospital', code: 'INST-MAYO', type: 'Hospital', areaId: state.areaId }], { token: state.manager });
  state.institutionId = inst.id;

  const member = await ok('teamMembers:save', [{ name: 'Ahmed Shah', designation: 'Rep', areaId: state.areaId }], { token: state.manager });
  assert.equal(member.role, 'Rep');
  state.teamMemberId = member.id;
  await ok('teamMembers:save', [{ name: 'Zainab Fatima', designation: 'Rep', area: 'Karachi Clifton' }], { token: state.manager });

  const product = await ok('products:save', [{
    brandName: 'CardioVas 50mg', productCode: 'PROD-CARD1', division: 'Cardiology', groupName: 'Cardiovascular',
    packSize: 10, unitTypeName: 'Tablets', tp: 4500, mrp: 5000, registrationNo: 'REG-1'
  }], { token: state.manager });
  assert.equal(product.groupName, 'Cardiovascular');
  assert.equal(product.unitTypeName, 'Tablet');
  assert.equal(product.perUnitPrice, 450);
  state.productId = product.id;

  const product2 = await ok('products:save', [{ brandName: 'HyperNorm 10mg', productCode: 'PROD-CARD2', tp: 2400, mrp: 2650 }], { token: state.manager });
  state.product2Id = product2.id;

  const dupCode = await call('products:save', [{ brandName: 'Other', productCode: 'PROD-CARD1', tp: 1, mrp: 1 }], { token: state.manager });
  assert.equal(dupCode.error, 'Product Code must be unique.');

  const edited = await ok('products:save', [{ ...product, status: 'Inactive' }], { token: state.manager });
  assert.equal(edited.status, 'Inactive');
  await ok('products:save', [{ ...product, status: 'Active' }], { token: state.manager });

  const injection = await call('areas:save', [{ name: "x'; DROP TABLE areas; --" }], { token: state.manager });
  assert.match(injection.error, /SQL Injection/);

  const list = await ok('products:getAll', [], { token: state.rep });
  assert.deepEqual(list.map((p) => p.brandName), ['CardioVas 50mg', 'HyperNorm 10mg']);
});

test('role rules: reps view master data, managers edit it, only admins delete', async () => {
  const repSave = await call('products:save', [{ brandName: 'Nope', productCode: 'X1', tp: 1, mrp: 1 }], { token: state.rep });
  assert.equal(repSave.status, 403);
  assert.match(repSave.error, /^Permission denied/);
  assert.doesNotMatch(repSave.error, /Unauthorized/); // would log the user out in the desktop app

  const managerDelete = await call('areas:delete', [state.areaId], { token: state.manager });
  assert.equal(managerDelete.status, 403);

  const inUse = await call('areas:delete', [state.areaId], { token: state.admin });
  assert.match(inUse.error, /cannot be deleted because it is currently used by/);

  const audit = await call('auditLogs:getAll', [{}], { token: state.manager });
  assert.equal(audit.status, 403);
});

test('targets: distribution validated in JavaScript and by the database trigger', async () => {
  const years = await ok('targets:getActiveBusinessYears', [], { token: state.manager });
  const distribution = [
    { areaName: 'Lahore Gulberg', percentage: 60, teamMembers: [{ name: 'Ahmed Shah', percentage: 100 }] },
    { areaName: 'Karachi Clifton', percentage: 40, teamMembers: [{ name: 'Zainab Fatima', percentage: 100 }] }
  ];
  const target = await ok('targets:save', [{
    businessYearId: years[0].id, productId: state.productId, annualTargetQty: 1000, areasDistribution: distribution
  }], { token: state.manager });
  assert.deepEqual(target.areasDistribution, distribution);
  state.targetId = target.id;

  const bad = await call('targets:save', [{
    businessYearId: years[0].id, productId: state.product2Id, annualTargetQty: 10,
    areasDistribution: [{ areaName: 'Lahore Gulberg', percentage: 50, teamMembers: [{ name: 'Ahmed Shah', percentage: 100 }] }]
  }], { token: state.manager });
  assert.match(bad.error, /must equal 100%/);
});

test('orders: create, totals from trigger, status changes and locking', async () => {
  const order = await ok('orders:save', [{
    createdBy: 'admin', // ignored: new orders belong to whoever is signed in
    orderNumber: 'PO-2026-001', orderDate: '2026-09-15', teamMemberId: state.teamMemberId,
    doctorId: state.doctorId, institutionId: state.institutionId, areaId: state.areaId,
    items: [
      { productId: state.productId, quantity: 20, unitPrice: 4500 },
      { productId: state.product2Id, quantity: 5, unitPrice: 2000 } // price override
    ]
  }], { token: state.rep });
  assert.equal(order.totalAmount, 20 * 4500 + 5 * 2000);
  assert.equal(order.status, 'Pending');
  assert.equal(order.createdBy, 'rafay');
  assert.equal(order.items.length, 2);
  state.orderId = order.id;

  const dupPo = await call('orders:save', [{
    orderNumber: 'PO-2026-001', orderDate: '2026-09-16', teamMemberId: state.teamMemberId,
    items: [{ productId: state.productId, quantity: 1, unitPrice: 4500 }]
  }], { token: state.rep });
  assert.equal(dupPo.error, 'PO Number already exists.');

  const outsideYear = await call('orders:save', [{
    orderNumber: 'PO-OLD', orderDate: '2025-01-01', teamMemberId: state.teamMemberId,
    items: [{ productId: state.productId, quantity: 1, unitPrice: 4500 }]
  }], { token: state.rep });
  assert.match(outsideYear.error, /must belong to active Business Year/);

  const edited = await ok('orders:save', [{
    id: state.orderId, orderNumber: 'PO-2026-001', orderDate: '2026-09-15', teamMemberId: state.teamMemberId,
    areaId: state.areaId, items: [{ productId: state.productId, quantity: 10, unitPrice: 4500 }]
  }], { token: state.rep });
  assert.equal(edited.totalAmount, 45000);
  assert.equal(edited.items.length, 1);

  const second = await ok('orders:save', [{
    orderNumber: 'PO-2026-002', orderDate: '2026-09-20', teamMemberId: state.teamMemberId, areaId: state.areaId,
    items: [{ productId: state.product2Id, quantity: 3, unitPrice: 2400 }]
  }], { token: state.rep });

  const cancelNoReason = await call('orders:changeStatus', [second.id, 'Cancelled', ''], { token: state.rep });
  assert.match(cancelNoReason.error, /cancellation reason/);
  const cancelled = await ok('orders:changeStatus', [second.id, 'Cancelled', 'Customer request'], { token: state.rep });
  assert.equal(cancelled.status, 'Cancelled');
  assert.equal(cancelled.cancelReason, 'Customer request');

  const completed = await ok('orders:changeStatus', [state.orderId, 'Completed'], { token: state.rep });
  assert.equal(completed.status, 'Completed');
  assert.equal(completed.completedBy, 'rafay');

  const locked = await call('orders:save', [{ ...edited, items: edited.items }], { token: state.rep });
  assert.match(locked.error, /read-only/);
  const deleteCompleted = await call('orders:delete', [state.orderId], { token: state.rep });
  assert.match(deleteCompleted.error, /Completed orders cannot be deleted/);

  const third = await ok('orders:save', [{
    orderNumber: 'PO-2026-003', orderDate: '2026-09-21', teamMemberId: state.teamMemberId, areaId: state.areaId,
    items: [{ productId: state.product2Id, quantity: 1, unitPrice: 2400 }]
  }], { token: state.rep });
  assert.equal(await ok('orders:delete', [third.id], { token: state.rep }), true);

  const all = await ok('orders:getAll', [], { token: state.admin });
  assert.deepEqual(all.map((o) => o.orderNumber), ['PO-2026-002', 'PO-2026-001']);

  const fkBlocked = await call('products:delete', [state.productId], { token: state.admin });
  assert.match(fkBlocked.error, /currently used in orders or targets/);
});

test('reports and analytics return the same shapes as before', async () => {
  const opts = { token: state.rep };
  const summary = await ok('reports:getDashboardSummaryData', [{}], opts);
  assert.equal(summary.totalSales, 45000);
  assert.equal(summary.totalOrders, 1);
  assert.equal(summary.targetQty, 1000);
  assert.equal(summary.actualQty, 10);

  const trend = await ok('reports:getSalesTrendData', [{}], opts);
  assert.deepEqual(trend, [{ month: '2026-09', orders: 1, sales: 45000 }]);

  const achievement = await ok('reports:getTargetAchievementData', [{}], opts);
  assert.equal(achievement.length, 2);
  const lahore = achievement.find((a) => a.targetQty === 600);
  assert.ok(lahore, 'expected 60% of 1000 for the first area');
  assert.equal(typeof lahore.qtyAchievementPercent, 'number');

  const team = await ok('reports:getTeamContributionData', [{}], opts);
  assert.equal(team[0].teamMemberName, 'Ahmed Shah'); // highest sales first
  assert.equal(team[0].totalOrders, 2);
  assert.equal(team[0].completedOrders, 1);
  assert.equal(team.find((t) => t.teamMemberName === 'Zainab Fatima').totalOrders, 0);

  const perf = await ok('reports:getProductPerformanceData', [{}], opts);
  assert.equal(perf[0].productCode, 'PROD-CARD1');
  assert.equal(perf[0].totalQty, 10);

  const detailed = await ok('reports:getReportsData', [{ startDate: '2026-09-01', endDate: '2026-09-30', status: 'Completed' }], opts);
  assert.equal(detailed.length, 1);
  assert.equal(detailed[0].items[0].productCode, 'PROD-CARD1');

  const kpis = await ok('analytics:getDashboardSummary', [], opts);
  assert.equal(kpis.totalOrders, 2);
  assert.equal(kpis.completedOrders, 1);
  assert.equal(kpis.currentBusinessYear, '2026-2027');
  assert.ok('activeRepresentatives' in kpis);

  const top = await ok('analytics:getTopProducts', [], opts);
  assert.equal(top[0].productCode, 'PROD-CARD1');

  const monthly = await ok('analytics:getMonthlySales', [], opts);
  assert.equal(monthly.length, 12);
  assert.equal(monthly.find((m) => m.month === 'September').revenue, 45000);

  const recent = await ok('analytics:getRecentOrders', [], opts);
  assert.equal(recent[0].orderNumber, 'PO-2026-002');
  assert.ok('representativeName' in recent[0]);

  for (const channel of ['analytics:getAreaPerformance', 'analytics:getRepresentativePerformance', 'analytics:getTargetProgress']) {
    await ok(channel, [], opts);
  }

  const search = await ok('search:global', ['cardio'], opts);
  assert.equal(search.products.length, 1);
  assert.equal(search.doctors.length, 1);
});

test('export center data for every report type', async () => {
  const types = ['Products', 'Doctors', 'Institutions', 'Areas', 'Team Members', 'Groups', 'Orders', 'Sales', 'Targets', 'Audit Trail', 'Master Export', 'Dashboard'];
  for (const reportType of types) {
    const data = await ok('export:getPreviewData', [{ reportType, filters: {} }], { token: state.manager });
    assert.ok(data.title && Array.isArray(data.columns) && Array.isArray(data.rows), reportType);
  }
  const search = await ok('export:getPreviewData', [{ reportType: 'Products', filters: { search: 'cardiovas' } }], { token: state.manager });
  assert.equal(search.rows.length, 1, 'search ignores upper/lower case like SQLite did');

  const master = await ok('export:getMasterData', [{ filters: {} }], { token: state.manager });
  assert.equal(Object.keys(master.modules).length, 12);

  const repExport = await call('export:getPreviewData', [{ reportType: 'Products' }], { token: state.rep });
  assert.equal(repExport.status, 403);
  await ok('export:logExport', [{ reportType: 'Products', format: 'xlsx', fileName: 'x.xlsx', totalRecords: 2 }], { token: state.rep });
});

test('settings: company-wide for admins, personal values per user', async () => {
  const repCompany = await call('settings:save', ['himmel_company_info', '{"name":"Hacked"}', 'Company'], { token: state.rep });
  assert.equal(repCompany.status, 403);

  await ok('settings:save', ['himmel_company_info', '{"name":"Himmel Pharmaceutical"}', 'Company'], { token: state.admin });
  const company = await ok('settings:getByKey', ['himmel_company_info'], { token: state.rep });
  assert.equal(company.value, '{"name":"Himmel Pharmaceutical"}');

  await ok('settings:save', ['himmel_account_info', '{"fullName":"Rafay"}', 'Account'], { token: state.rep });
  await ok('settings:save', ['himmel_account_info', '{"fullName":"Maria"}', 'Account'], { token: state.manager });
  assert.equal((await ok('settings:getByKey', ['himmel_account_info'], { token: state.rep })).value, '{"fullName":"Rafay"}');
  assert.equal((await ok('settings:getByKey', ['himmel_account_info'], { token: state.manager })).value, '{"fullName":"Maria"}');

  const all = await ok('settings:getAll', [], { token: state.rep });
  assert.equal(all.himmel_account_info, '{"fullName":"Rafay"}');
  assert.ok(!Object.keys(all).some((k) => k.startsWith('user:')));

  assert.equal(await ok('settings:getByKey', ['does_not_exist'], { token: state.rep }), null);
});

test('maintenance mode blocks non-admin logins', async () => {
  await ok('settings:save', ['maintenance_mode', 'true', 'general'], { token: state.admin });
  const blocked = await call('auth:login', [{ username: 'rafay', password: 'RepPass#2026' }]);
  assert.match(blocked.error, /under maintenance/);
  await ok('settings:save', ['maintenance_mode', 'false', 'general'], { token: state.admin });
  state.rep = await login('rafay', 'RepPass#2026');
});

test('tasks and reminders are private to each user', async () => {
  const task = await ok('tasks:save', [{ text: 'Visit Mayo Hospital', done: false }], { token: state.rep });
  await ok('tasks:save', [{ ...task, done: true }], { token: state.rep });
  assert.deepEqual(await ok('tasks:getAll', [], { token: state.rep }), [{ id: task.id, text: 'Visit Mayo Hospital', done: 1 }]);
  assert.deepEqual(await ok('tasks:getAll', [], { token: state.manager }), []);

  await ok('tasks:delete', [task.id], { token: state.manager }); // not theirs: no effect
  assert.equal((await ok('tasks:getAll', [], { token: state.rep })).length, 1);

  const reminder = await ok('reminders:save', [{ title: 'Sales review', time: 'Today, 2:00 PM', type: 'meeting' }], { token: state.manager });
  assert.equal((await ok('reminders:getAll', [], { token: state.manager }))[0].id, reminder.id);
  assert.deepEqual(await ok('reminders:getAll', [], { token: state.rep }), []);
});

test('audit trail records who did what', async () => {
  const { logs, total } = await ok('auditLogs:getAll', [{ module: 'Orders', limit: 50 }], { token: state.admin });
  assert.ok(total >= 5);
  assert.ok(logs.some((l) => l.action === 'Price Override' && l.performedBy === 'rafay'));
  assert.ok(logs.some((l) => l.action === 'Sale Completed'));
  const one = await ok('auditLogs:getById', [logs[0].id], { token: state.admin });
  assert.equal(one.id, logs[0].id);
});

test('integrity check and diagnostics', async () => {
  const report = await ok('integrity:check', [], { token: state.admin });
  assert.equal(report.healthy, true, JSON.stringify(report.reports));
  assert.equal(report.audit.orders.total, 2);
  const diag = await ok('diagnostics:get', [], { token: state.admin });
  assert.equal(diag.databaseAvailable, true);
  assert.equal(diag.counts.users, 3);
});

test('backup export and restore round trip', async () => {
  const snapshot = await ok('backup:export', [], { token: state.admin });
  assert.equal(snapshot.format, 'himmel-cloud-backup');
  assert.ok(!snapshot.tables.users, 'login accounts are not part of in-app backups');
  assert.equal(snapshot.tables.orders.rows.length, 2);

  // Change data, then restore the backup.
  await ok('areas:save', [{ name: 'Temporary Area' }], { token: state.admin });
  const restored = await ok('backup:restore', [snapshot, { fileName: 'test.json' }], { token: state.admin });
  assert.equal(restored.counts.orders, 2);

  const areas = await ok('areas:getAll', [], { token: state.admin });
  assert.ok(!areas.some((a) => a.name === 'Temporary Area'));
  const orders = await ok('orders:getAll', [], { token: state.admin });
  assert.equal(orders.find((o) => o.orderNumber === 'PO-2026-001').totalAmount, 45000);

  // Identity sequences continue after the highest restored id.
  const area = await ok('areas:save', [{ name: 'After Restore' }], { token: state.admin });
  assert.ok(area.id > Math.max(...snapshot.tables.areas.rows.map((r) => r[0])));
  assert.equal((await ok('tasks:getAll', [], { token: state.rep })).length, 1, 'task owners kept');

  const repRestore = await call('backup:restore', [snapshot], { token: state.rep });
  assert.equal(repRestore.status, 403);
  const anonymousRestore = await call('backup:restore', [snapshot]);
  assert.equal(anonymousRestore.status, 401, 'large upload refused before it is read');
  const invalid = await call('backup:restore', [{ hello: 'world' }], { token: state.admin });
  assert.match(invalid.error, /Invalid Backup File/);
});

test('emergency recovery stays disabled until an admin sets it up, then needs the recovery token', async () => {
  const notConfigured = await call('auth:recoveryVerifyPassword', ['Recovery@123']);
  assert.match(notConfigured.error, /not set up yet/);
  const noToken = await call('auth:recoveryGetUsers');
  assert.equal(noToken.status, 401);

  const repChange = await call('auth:changeRecoveryPassword', [{ currentPassword: 'Recovery@123', newPassword: 'Rescue#Pass99' }], { token: state.rep });
  assert.equal(repChange.status, 403);
  await ok('auth:changeRecoveryPassword', [{ currentPassword: 'Recovery@123', newPassword: 'Rescue#Pass99' }], { token: state.admin });
  await ok('auth:changeRecoveryPin', [{ currentAuth: 'Rescue#Pass99', newPin: '482916' }], { token: state.admin });

  const status = await ok('auth:getSecurityStatus');
  assert.equal(status.hasRecoveryPassword, true);
  assert.equal(status.hasRecoveryPin, true);

  const wrong = await call('auth:recoveryVerifyPassword', ['nope']);
  assert.equal(wrong.error, 'Invalid emergency recovery password.');

  const verified = await ok('auth:recoveryVerifyPassword', ['Rescue#Pass99']);
  assert.ok(verified.recoveryToken);
  const users = await ok('auth:recoveryGetUsers', [], { recoveryToken: verified.recoveryToken });
  assert.equal(users.length, 3);

  const pin = await ok('auth:verifyRecoveryPin', [{ pin: '482916' }]);
  await ok('auth:recoveryResetUserPassword', [{ username: 'maria', newPassword: 'Reset#Maria1', confirmPassword: 'Reset#Maria1' }], { recoveryToken: pin.recoveryToken });

  // Resetting the password signs that user out everywhere.
  const oldToken = await call('products:getAll', [], { token: state.manager });
  assert.equal(oldToken.status, 401);
  state.manager = await login('maria', 'Reset#Maria1');

  // An ordinary login token is not a recovery token.
  const misuse = await call('auth:recoveryGetUsers', [], { recoveryToken: state.admin });
  assert.equal(misuse.status, 401);
});

test('disabling a user or changing a password ends their other sessions', async () => {
  await ok('auth:disableUser', [{ username: 'rafay' }], { token: state.admin });
  const disabled = await call('orders:getAll', [], { token: state.rep });
  assert.equal(disabled.status, 401);
  const disabledLogin = await call('auth:login', [{ username: 'rafay', password: 'RepPass#2026' }]);
  assert.match(disabledLogin.error, /disabled/);
  await ok('auth:activateUser', [{ username: 'rafay' }], { token: state.admin });
  state.rep = await login('rafay', 'RepPass#2026');

  const otherComputer = await login('rafay', 'RepPass#2026');
  const changed = await call('auth:changePassword', [{ oldPassword: 'RepPass#2026', newPassword: 'NewRep#2026' }], { token: state.rep });
  assert.equal(changed.success, true);
  assert.ok(changed.refreshedToken, 'the computer that changed the password gets a new token');
  assert.equal((await call('orders:getAll', [], { token: otherComputer })).status, 401);
  assert.equal((await call('orders:getAll', [], { token: changed.refreshedToken })).success, true);
});

test('the last active administrator cannot be removed', async () => {
  const res = await call('auth:disableUser', [{ username: 'admin' }], { token: state.admin });
  assert.match(res.error, /last active administrator/);
  const demote = await call('auth:changeRole', [{ username: 'admin', role: 'Manager' }], { token: state.admin });
  assert.match(demote.error, /last active administrator/);
  const del = await call('auth:deleteUser', ['admin'], { token: state.admin });
  assert.match(del.error, /cannot be deleted/);
});

test('account locks after five wrong passwords', async () => {
  await ok('auth:createUser', [{ username: 'lockme', password: 'LockMe#2026', fullName: 'Lock Me', role: 'Rep' }], { token: state.admin });
  for (let i = 0; i < 4; i++) {
    const r = await call('auth:login', [{ username: 'lockme', password: 'wrong' }]);
    assert.equal(r.error, 'Invalid username or password.');
  }
  const fifth = await call('auth:login', [{ username: 'lockme', password: 'wrong' }]);
  assert.match(fifth.error, /Account locked/);
  const correct = await call('auth:login', [{ username: 'lockme', password: 'LockMe#2026' }]);
  assert.match(correct.error, /temporarily locked/);
});
