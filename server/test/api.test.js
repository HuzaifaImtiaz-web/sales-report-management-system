// End-to-end API tests: real server + real PostgreSQL (PGlite in memory) over HTTP.
// Run with: npm test
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { PGlite } = require('@electric-sql/pglite');
const { PGLiteSocketServer } = require('@electric-sql/pglite-socket');

const ADMIN_PASSWORD = 'Himmel#Chief2026';
let pglite;
let socketServer;
let httpServer;
let baseUrl;
let closeDb;
let getDb;
let config;
let staticDir;

/**
 * A browser stand-in: keeps cookies like a browser does and sends the CSRF token the web app
 * keeps in memory (from sign-in, auth:getCurrentUser or the X-CSRF-Token response header).
 */
class Client {
  constructor() {
    this.cookies = new Map();
    this.csrf = null;
  }

  headers(extra = {}) {
    const h = { 'Content-Type': 'application/json', Origin: baseUrl, ...extra };
    if (this.cookies.size) h.Cookie = [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
    if (this.csrf && !('X-CSRF-Token' in extra)) h['X-CSRF-Token'] = this.csrf;
    for (const [k, v] of Object.entries(h)) if (v === null) delete h[k];
    return h;
  }

  absorb(res) {
    for (const cookie of res.headers.getSetCookie()) {
      const [pair] = cookie.split(';');
      const idx = pair.indexOf('=');
      const name = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      if (!value || /max-age=0/i.test(cookie)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    const rotated = res.headers.get('x-csrf-token');
    if (rotated) this.csrf = rotated;
  }

  async call(channel, args = [], { headers = {}, csrf } = {}) {
    const extra = { ...headers };
    if (csrf !== undefined) extra['X-CSRF-Token'] = csrf;
    const res = await fetch(`${baseUrl}/api/rpc/${encodeURIComponent(channel)}`, {
      method: 'POST',
      headers: this.headers(extra),
      body: JSON.stringify({ args })
    });
    this.absorb(res);
    const body = await res.json();
    if (body.success && body.data && body.data.csrfToken && ['auth:login', 'auth:getCurrentUser'].includes(channel)) {
      this.csrf = body.data.csrfToken;
    }
    return { status: res.status, headers: res.headers, ...body };
  }

  async ok(channel, args, opts) {
    const res = await this.call(channel, args, opts);
    assert.equal(res.success, true, `${channel} failed: ${res.error}`);
    return res.data;
  }

  async post(urlPath, body, { headers = {}, raw = null } = {}) {
    const res = await fetch(`${baseUrl}${urlPath}`, {
      method: 'POST',
      headers: this.headers(headers),
      body: raw || JSON.stringify(body)
    });
    this.absorb(res);
    return res;
  }
}

async function login(username, password) {
  const client = new Client();
  await client.ok('auth:login', [{ username, password }]);
  return client;
}

const anonymous = () => new Client();
const state = {};

before(async () => {
  pglite = await PGlite.create();
  socketServer = new PGLiteSocketServer({ db: pglite, port: 0, host: '127.0.0.1', maxConnections: 10 });
  await socketServer.start();
  const dbPort = socketServer.server.address().port;

  // A tiny built web app, to check the server can host the site itself (non-Vercel hosting).
  staticDir = fs.mkdtempSync(path.join(os.tmpdir(), 'himmel-web-'));
  fs.mkdirSync(path.join(staticDir, 'assets'));
  fs.writeFileSync(path.join(staticDir, 'index.html'), '<!doctype html><title>Himmel</title><div id="root"></div>');
  fs.writeFileSync(path.join(staticDir, 'assets', 'app-abc123.js'), 'console.log(1)');

  process.env.HIMMEL_SKIP_ENV_FILE = '1';
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:${dbPort}/postgres`;
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
  process.env.TRUST_PROXY = '0';
  process.env.STATIC_DIR = staticDir;

  config = require('../src/config');
  const { start } = require('../src/index');
  ({ closeDb, getDb } = require('../src/db'));
  const started = await start({ port: 0, host: '127.0.0.1' });
  httpServer = started.server;
  baseUrl = `http://127.0.0.1:${httpServer.address().port}`;
});

after(async () => {
  if (httpServer) await new Promise((resolve) => httpServer.close(resolve));
  if (closeDb) await closeDb();
  if (socketServer) await socketServer.stop();
  if (pglite) await pglite.close();
  if (staticDir) fs.rmSync(staticDir, { recursive: true, force: true });
});

// ─── Security basics ────────────────────────────────────────────────────────

test('health endpoint reports the database is reachable without revealing versions', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok' });
  assert.equal(res.headers.get('x-powered-by'), null);
});

test('API responses carry security headers and are never cached', async () => {
  const res = await anonymous().call('auth:getCurrentUser');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.match(res.headers.get('content-security-policy'), /default-src 'none'/);
  assert.match(res.headers.get('referrer-policy'), /strict-origin/);
  assert.equal(res.headers.get('access-control-allow-origin'), null, 'no CORS: other sites cannot read responses');
});

test('the server hosts the built web app with a strict content security policy', async () => {
  const page = await fetch(`${baseUrl}/`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /<div id="root">/);
  const csp = page.headers.get('content-security-policy');
  assert.match(csp, /script-src 'self'(;|$)/, 'no inline or eval scripts');
  assert.match(csp, /frame-ancestors 'none'/);
  assert.equal(page.headers.get('cache-control'), 'no-cache');

  const asset = await fetch(`${baseUrl}/assets/app-abc123.js`);
  assert.equal(asset.status, 200);
  assert.match(asset.headers.get('cache-control'), /immutable/);

  const deepLink = await fetch(`${baseUrl}/orders`);
  assert.match(await deepLink.text(), /<div id="root">/);

  const apiMiss = await fetch(`${baseUrl}/api/nothing-here`);
  assert.equal(apiMiss.status, 404);
  assert.equal((await apiMiss.json()).success, false);
});

test('requests without a session are rejected as an expired session', async () => {
  const res = await anonymous().call('products:getAll');
  assert.equal(res.status, 401);
  assert.match(res.error, /Session expired/);
});

test('unknown channels return 404', async () => {
  const res = await anonymous().call('nope:nothing');
  assert.equal(res.status, 404);
});

test('only JSON requests from this site are accepted', async () => {
  const evil = await anonymous().call('auth:login', [{ username: 'admin', password: ADMIN_PASSWORD }], {
    headers: { Origin: 'https://evil.example' }
  });
  assert.equal(evil.status, 403);
  assert.match(evil.error, /Cross-site/);

  const crossSite = await anonymous().call('auth:login', [{ username: 'admin', password: ADMIN_PASSWORD }], {
    headers: { 'Sec-Fetch-Site': 'cross-site' }
  });
  assert.equal(crossSite.status, 403);

  const form = await fetch(`${baseUrl}/api/rpc/auth:login`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ args: [{ username: 'admin', password: ADMIN_PASSWORD }] })
  });
  assert.equal(form.status, 415);
});

test('login: wrong password, then the seeded administrator gets an HttpOnly session cookie', async () => {
  const bad = await anonymous().call('auth:login', [{ username: 'admin', password: 'wrong-password' }]);
  assert.equal(bad.success, false);
  assert.equal(bad.error, 'Invalid username or password.');

  const unknown = await anonymous().call('auth:login', [{ username: 'ghost', password: 'whatever123' }]);
  assert.equal(unknown.error, 'Invalid username or password.');

  const client = new Client();
  const res = await client.call('auth:login', [{ username: 'ADMIN', password: ADMIN_PASSWORD }]);
  assert.equal(res.success, true);
  assert.equal(res.data.user.username, 'admin');
  assert.equal(res.data.user.role, 'Admin');
  assert.ok(res.data.csrfToken, 'the page gets a CSRF token to send back');
  assert.equal(res.data.token, undefined, 'the session token never reaches page scripts');

  const cookie = res.headers.getSetCookie().find((c) => c.startsWith(`${config.cookies.session}=`));
  assert.ok(cookie, 'session cookie set');
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Path=\//);
  state.admin = client;

  // The session survives a page reload: auth:getCurrentUser returns the user and a CSRF token.
  const reloaded = new Client();
  reloaded.cookies = new Map(client.cookies);
  const current = await reloaded.ok('auth:getCurrentUser');
  assert.equal(current.user.username, 'admin');
  assert.equal(current.csrfToken, client.csrf);
});

test('signed-in calls need the CSRF token', async () => {
  const noToken = await state.admin.call('products:getAll', [], { csrf: null });
  assert.equal(noToken.status, 403);
  assert.equal(noToken.code, 'CSRF');
  const wrongToken = await state.admin.call('products:getAll', [], { csrf: 'forged-token' });
  assert.equal(wrongToken.status, 403);
  assert.equal((await state.admin.call('products:getAll')).success, true);
});

test('only a hash of the session token is stored in the database', async () => {
  const raw = state.admin.cookies.get(config.cookies.session);
  const rows = await getDb().all('SELECT id_hash FROM sessions');
  assert.ok(rows.length >= 1);
  assert.ok(!rows.some((r) => r.id_hash === raw || r.id_hash === decodeURIComponent(raw)));
});

test('passwords must meet the policy', async () => {
  const weak = [
    ['short1!A', /at least 10/],
    ['alllowercase#2026', /uppercase/],
    ['NoNumbers#Here', /number/],
    ['NoSymbols2026x', /special/],
    ['Password123!', /too common/],
    ['Weakuser#2026', /username/]
  ];
  for (const [password, rule] of weak) {
    const res = await state.admin.call('auth:createUser', [{ username: 'weakuser', password, fullName: 'Weak User', role: 'Rep' }]);
    assert.equal(res.success, false, password);
    assert.match(res.error, rule, password);
  }
});

test('administrator creates a manager and a sales rep that share the same data', async () => {
  const manager = await state.admin.ok('auth:createUser', [{ username: 'maria', password: 'Manager#2026', fullName: 'Maria Manager', role: 'Manager' }]);
  assert.equal(manager.role, 'Manager');
  await state.admin.ok('auth:createUser', [{ username: 'rafay', password: 'RepPass#2026', fullName: 'Rafay Rep', role: 'Sales Representative' }]);

  const dup = await state.admin.call('auth:createUser', [{ username: 'RAFAY', password: 'RepPass#2026x', fullName: 'Dup', role: 'Rep' }]);
  assert.match(dup.error, /already exists/);

  state.manager = await login('maria', 'Manager#2026');
  state.rep = await login('rafay', 'RepPass#2026');

  const users = await state.admin.ok('auth:getAllUsers');
  assert.deepEqual(users.map((u) => u.username).sort(), ['admin', 'maria', 'rafay']);
  assert.ok(!users.some((u) => 'passwordHash' in u), 'password hashes never leave the server');
});

test('reference data was seeded', async () => {
  const divisions = await state.rep.ok('divisions:getAll');
  assert.deepEqual(divisions.map((d) => d.name), ['Cardiology', 'Oncology']);
  const groups = await state.rep.ok('categories:getAll');
  assert.equal(groups.length, 9);
  const years = await state.rep.ok('targets:getActiveBusinessYears');
  assert.equal(years[0].value, '2026-2027');
});

test('master data: create, read, update with validation and audit', async () => {
  const area = await state.manager.ok('areas:save', [{ name: 'Lahore Gulberg', city: 'Lahore', description: 'Main zone' }]);
  assert.equal(area.status, 'Active');
  state.areaId = area.id;

  const dupArea = await state.manager.call('areas:save', [{ name: 'lahore gulberg', city: 'LAHORE' }]);
  assert.equal(dupArea.error, 'Area with this Name and City already exists.');

  // Area given by name is created automatically (DoctorValidator behaviour).
  const doctor = await state.manager.ok('doctors:save', [{ name: 'Dr. Ayesha Khan', specialty: 'Cardiologist', hospital: 'Mayo Hospital', area: 'Karachi Clifton' }]);
  assert.equal(doctor.areaName, 'Karachi Clifton');
  state.doctorId = doctor.id;

  const dupDoctor = await state.manager.call('doctors:save', [{ name: 'dr. ayesha khan', hospital: 'MAYO HOSPITAL', areaId: doctor.areaId }]);
  assert.equal(dupDoctor.error, 'Doctor already exists.');

  const inst = await state.manager.ok('institutions:save', [{ name: 'Mayo Hospital', code: 'INST-MAYO', type: 'Hospital', areaId: state.areaId }]);
  state.institutionId = inst.id;

  const member = await state.manager.ok('teamMembers:save', [{ name: 'Ahmed Shah', designation: 'Rep', areaId: state.areaId }]);
  assert.equal(member.role, 'Rep');
  state.teamMemberId = member.id;
  await state.manager.ok('teamMembers:save', [{ name: 'Zainab Fatima', designation: 'Rep', area: 'Karachi Clifton' }]);

  const product = await state.manager.ok('products:save', [{
    brandName: 'CardioVas 50mg', productCode: 'PROD-CARD1', division: 'Cardiology', groupName: 'Cardiovascular',
    packSize: 10, unitTypeName: 'Tablets', tp: 4500, mrp: 5000, registrationNo: 'REG-1',
    description: 'Prescription only. Union pharmacy description.'
  }]);
  assert.equal(product.groupName, 'Cardiovascular');
  assert.equal(product.unitTypeName, 'Tablet');
  assert.equal(product.perUnitPrice, 450);
  state.productId = product.id;

  const product2 = await state.manager.ok('products:save', [{ brandName: 'HyperNorm 10mg', productCode: 'PROD-CARD2', tp: 2400, mrp: 2650 }]);
  state.product2Id = product2.id;

  const dupCode = await state.manager.call('products:save', [{ brandName: 'Other', productCode: 'PROD-CARD1', tp: 1, mrp: 1 }]);
  assert.equal(dupCode.error, 'Product Code must be unique.');

  const edited = await state.manager.ok('products:save', [{ ...product, status: 'Inactive' }]);
  assert.equal(edited.status, 'Inactive');
  await state.manager.ok('products:save', [{ ...product, status: 'Active' }]);

  // Markup is rejected; SQL-looking text is just text (every query is parameterized).
  const xss = await state.manager.call('areas:save', [{ name: '<script>alert(1)</script>' }]);
  assert.match(xss.error, /HTML or script/);
  const img = await state.manager.call('doctors:save', [{ name: 'Dr <img src=x onerror=alert(1)>', hospital: 'X' }]);
  assert.match(img.error, /HTML or script/);
  const link = await state.manager.call('institutions:save', [{ name: 'javascript:alert(1)', code: 'JS-1' }]);
  assert.match(link.error, /HTML or script/);
  const sqlText = await state.manager.ok('areas:save', [{ name: "O'Brien Union; DROP TABLE areas; --", city: 'Quetta' }]);
  assert.equal(sqlText.name, "O'Brien Union; DROP TABLE areas; --");
  assert.ok((await state.rep.ok('areas:getAll')).length >= 3, 'areas table is intact');
  await state.admin.ok('areas:delete', [sqlText.id]);

  const list = await state.rep.ok('products:getAll');
  assert.deepEqual(list.map((p) => p.brandName), ['CardioVas 50mg', 'HyperNorm 10mg']);
});

test('role rules: reps view master data, managers edit it, only admins delete', async () => {
  const repSave = await state.rep.call('products:save', [{ brandName: 'Nope', productCode: 'X1', tp: 1, mrp: 1 }]);
  assert.equal(repSave.status, 403);
  assert.match(repSave.error, /^Permission denied/);

  const managerDelete = await state.manager.call('areas:delete', [state.areaId]);
  assert.equal(managerDelete.status, 403);

  const inUse = await state.admin.call('areas:delete', [state.areaId]);
  assert.match(inUse.error, /cannot be deleted because it is currently used by/);

  for (const channel of ['auditLogs:getAll', 'auth:getAllUsers', 'diagnostics:get', 'integrity:check', 'backup:getHistory']) {
    assert.equal((await state.manager.call(channel, [{}])).status, 403, channel);
    assert.equal((await state.rep.call(channel, [{}])).status, 403, channel);
  }
  const repCreatesUser = await state.rep.call('auth:createUser', [{ username: 'sneaky', password: 'Sneaky#2026x', fullName: 'Sneaky', role: 'Admin' }]);
  assert.equal(repCreatesUser.status, 403);
});

test('targets: distribution validated in JavaScript and by the database trigger', async () => {
  const years = await state.manager.ok('targets:getActiveBusinessYears');
  const distribution = [
    { areaName: 'Lahore Gulberg', percentage: 60, teamMembers: [{ name: 'Ahmed Shah', percentage: 100 }] },
    { areaName: 'Karachi Clifton', percentage: 40, teamMembers: [{ name: 'Zainab Fatima', percentage: 100 }] }
  ];
  const target = await state.manager.ok('targets:save', [{
    businessYearId: years[0].id, productId: state.productId, annualTargetQty: 1000, areasDistribution: distribution
  }]);
  assert.deepEqual(target.areasDistribution, distribution);
  state.targetId = target.id;

  const bad = await state.manager.call('targets:save', [{
    businessYearId: years[0].id, productId: state.product2Id, annualTargetQty: 10,
    areasDistribution: [{ areaName: 'Lahore Gulberg', percentage: 50, teamMembers: [{ name: 'Ahmed Shah', percentage: 100 }] }]
  }]);
  assert.match(bad.error, /must equal 100%/);

  assert.equal((await state.rep.call('targets:save', [{ ...target }])).status, 403);
});

test('orders: reps enter them, managers cancel, only admins complete and delete', async () => {
  const order = await state.rep.ok('orders:save', [{
    createdBy: 'admin', // ignored: new orders belong to whoever is signed in
    orderNumber: 'PO-2026-001', orderDate: '2026-09-15', teamMemberId: state.teamMemberId,
    doctorId: state.doctorId, institutionId: state.institutionId, areaId: state.areaId,
    items: [
      { productId: state.productId, quantity: 20, unitPrice: 4500 },
      { productId: state.product2Id, quantity: 5, unitPrice: 2000 } // price override
    ]
  }]);
  assert.equal(order.totalAmount, 20 * 4500 + 5 * 2000);
  assert.equal(order.status, 'Pending');
  assert.equal(order.createdBy, 'rafay');
  assert.equal(order.items.length, 2);
  state.orderId = order.id;

  const dupPo = await state.rep.call('orders:save', [{
    orderNumber: 'PO-2026-001', orderDate: '2026-09-16', teamMemberId: state.teamMemberId,
    items: [{ productId: state.productId, quantity: 1, unitPrice: 4500 }]
  }]);
  assert.equal(dupPo.error, 'PO Number already exists.');

  const outsideYear = await state.rep.call('orders:save', [{
    orderNumber: 'PO-OLD', orderDate: '2025-01-01', teamMemberId: state.teamMemberId,
    items: [{ productId: state.productId, quantity: 1, unitPrice: 4500 }]
  }]);
  assert.match(outsideYear.error, /must belong to active Business Year/);

  const edited = await state.rep.ok('orders:save', [{
    id: state.orderId, orderNumber: 'PO-2026-001', orderDate: '2026-09-15', teamMemberId: state.teamMemberId,
    areaId: state.areaId, items: [{ productId: state.productId, quantity: 10, unitPrice: 4500 }]
  }]);
  assert.equal(edited.totalAmount, 45000);
  assert.equal(edited.items.length, 1);

  const second = await state.rep.ok('orders:save', [{
    orderNumber: 'PO-2026-002', orderDate: '2026-09-20', teamMemberId: state.teamMemberId, areaId: state.areaId,
    items: [{ productId: state.product2Id, quantity: 3, unitPrice: 2400 }]
  }]);

  // Permission matrix (src/services/permissionService.js), enforced by the server.
  assert.equal((await state.rep.call('orders:changeStatus', [second.id, 'Cancelled', 'Customer request'])).status, 403);
  assert.equal((await state.rep.call('orders:changeStatus', [state.orderId, 'Completed'])).status, 403);
  assert.equal((await state.manager.call('orders:changeStatus', [state.orderId, 'Completed'])).status, 403);

  const cancelNoReason = await state.manager.call('orders:changeStatus', [second.id, 'Cancelled', '']);
  assert.match(cancelNoReason.error, /cancellation reason/);
  const cancelled = await state.manager.ok('orders:changeStatus', [second.id, 'Cancelled', 'Customer request']);
  assert.equal(cancelled.status, 'Cancelled');
  assert.equal(cancelled.cancelReason, 'Customer request');

  const completed = await state.admin.ok('orders:changeStatus', [state.orderId, 'Completed']);
  assert.equal(completed.status, 'Completed');
  assert.equal(completed.completedBy, 'admin');

  const locked = await state.rep.call('orders:save', [{ ...edited, items: edited.items }]);
  assert.match(locked.error, /read-only/);
  const deleteCompleted = await state.admin.call('orders:delete', [state.orderId]);
  assert.match(deleteCompleted.error, /Completed orders cannot be deleted/);

  const third = await state.rep.ok('orders:save', [{
    orderNumber: 'PO-2026-003', orderDate: '2026-09-21', teamMemberId: state.teamMemberId, areaId: state.areaId,
    items: [{ productId: state.product2Id, quantity: 1, unitPrice: 2400 }]
  }]);
  assert.equal((await state.rep.call('orders:delete', [third.id])).status, 403);
  assert.equal((await state.manager.call('orders:delete', [third.id])).status, 403);
  assert.equal(await state.admin.ok('orders:delete', [third.id]), true);

  const all = await state.admin.ok('orders:getAll');
  assert.deepEqual(all.map((o) => o.orderNumber), ['PO-2026-002', 'PO-2026-001']);

  const fkBlocked = await state.admin.call('products:delete', [state.productId]);
  assert.match(fkBlocked.error, /currently used in orders or targets/);
});

test('reports and analytics return the same shapes as before', async () => {
  const c = state.rep;
  const summary = await c.ok('reports:getDashboardSummaryData', [{}]);
  assert.equal(summary.totalSales, 45000);
  assert.equal(summary.totalOrders, 1);
  assert.equal(summary.targetQty, 1000);
  assert.equal(summary.actualQty, 10);

  const trend = await c.ok('reports:getSalesTrendData', [{}]);
  assert.deepEqual(trend, [{ month: '2026-09', orders: 1, sales: 45000 }]);

  const achievement = await c.ok('reports:getTargetAchievementData', [{}]);
  assert.equal(achievement.length, 2);
  const lahore = achievement.find((a) => a.targetQty === 600);
  assert.ok(lahore, 'expected 60% of 1000 for the first area');
  assert.equal(typeof lahore.qtyAchievementPercent, 'number');

  const team = await c.ok('reports:getTeamContributionData', [{}]);
  assert.equal(team[0].teamMemberName, 'Ahmed Shah'); // highest sales first
  assert.equal(team[0].totalOrders, 2);
  assert.equal(team[0].completedOrders, 1);
  assert.equal(team.find((t) => t.teamMemberName === 'Zainab Fatima').totalOrders, 0);

  const perf = await c.ok('reports:getProductPerformanceData', [{}]);
  assert.equal(perf[0].productCode, 'PROD-CARD1');
  assert.equal(perf[0].totalQty, 10);

  const detailed = await c.ok('reports:getReportsData', [{ startDate: '2026-09-01', endDate: '2026-09-30', status: 'Completed' }]);
  assert.equal(detailed.length, 1);
  assert.equal(detailed[0].items[0].productCode, 'PROD-CARD1');

  const kpis = await c.ok('analytics:getDashboardSummary');
  assert.equal(kpis.totalOrders, 2);
  assert.equal(kpis.completedOrders, 1);
  assert.equal(kpis.currentBusinessYear, '2026-2027');
  assert.ok('activeRepresentatives' in kpis);

  const top = await c.ok('analytics:getTopProducts');
  assert.equal(top[0].productCode, 'PROD-CARD1');

  const monthly = await c.ok('analytics:getMonthlySales');
  assert.equal(monthly.length, 12);
  assert.equal(monthly.find((m) => m.month === 'September').revenue, 45000);

  const recent = await c.ok('analytics:getRecentOrders');
  assert.equal(recent[0].orderNumber, 'PO-2026-002');
  assert.ok('representativeName' in recent[0]);

  for (const channel of ['analytics:getAreaPerformance', 'analytics:getRepresentativePerformance', 'analytics:getTargetProgress']) {
    await c.ok(channel);
  }

  const search = await c.ok('search:global', ['cardio']);
  assert.equal(search.products.length, 1);
  assert.equal(search.doctors.length, 1);
});

test('export center data for every report type', async () => {
  const types = ['Products', 'Doctors', 'Institutions', 'Areas', 'Team Members', 'Groups', 'Orders', 'Sales', 'Targets', 'Audit Trail', 'Master Export', 'Dashboard'];
  for (const reportType of types) {
    const data = await state.manager.ok('export:getPreviewData', [{ reportType, filters: {} }]);
    assert.ok(data.title && Array.isArray(data.columns) && Array.isArray(data.rows), reportType);
  }
  const search = await state.manager.ok('export:getPreviewData', [{ reportType: 'Products', filters: { search: 'cardiovas' } }]);
  assert.equal(search.rows.length, 1, 'search ignores upper/lower case like SQLite did');

  const repExport = await state.rep.call('export:getPreviewData', [{ reportType: 'Products' }]);
  assert.equal(repExport.status, 403);
  for (const removed of ['export:getMasterData', 'export:logExport', 'backup:export', 'backup:restore']) {
    assert.equal((await state.admin.call(removed, [{}])).status, 404, `${removed} is no longer an RPC channel`);
  }
});

test('export files are built on the server in every format', async () => {
  const cases = [
    { reportType: 'Products', format: 'excel', type: /spreadsheetml/, magic: 'PK', ext: 'xlsx' },
    { reportType: 'Audit Trail', format: 'pdf', type: /application\/pdf/, magic: '%PDF', ext: 'pdf' },
    { reportType: 'Orders', format: 'pptx', type: /presentationml/, magic: 'PK', ext: 'pptx' },
    { reportType: 'Master Export', format: 'excel', type: /spreadsheetml/, magic: 'PK', ext: 'xlsx' },
    { reportType: 'Master Export', format: 'pdf', type: /application\/pdf/, magic: '%PDF', ext: 'pdf' },
    { reportType: 'Master Export', format: 'pptx', type: /presentationml/, magic: 'PK', ext: 'pptx' }
  ];
  for (const c of cases) {
    const res = await state.manager.post('/api/export', { reportType: c.reportType, format: c.format, filters: {}, timeZone: 'Asia/Karachi' });
    assert.equal(res.status, 200, `${c.reportType} ${c.format}: ${res.status}`);
    assert.match(res.headers.get('content-type'), c.type);
    assert.match(res.headers.get('content-disposition'), new RegExp(`^attachment; filename="Himmel_[A-Za-z_]+_\\d{4}-\\d{2}-\\d{2}\\.${c.ext}"$`));
    const bytes = Buffer.from(await res.arrayBuffer());
    assert.equal(bytes.subarray(0, c.magic.length).toString('latin1'), c.magic, `${c.reportType} ${c.format}`);
  }

  // The audit trail has more rows than fit on one page: page footers need buffered pages.
  const audit = await state.manager.post('/api/export', { reportType: 'Audit Trail', format: 'pdf', filters: {} });
  const pdf = Buffer.from(await audit.arrayBuffer()).toString('latin1');
  assert.ok((pdf.match(/\/Type \/Page\b/g) || []).length >= 2, 'multi-page PDF');

  assert.equal((await state.rep.post('/api/export', { reportType: 'Products', format: 'excel' })).status, 403);
  assert.equal((await anonymous().post('/api/export', { reportType: 'Products', format: 'excel' })).status, 401);
  const noCsrf = await state.manager.post('/api/export', { reportType: 'Products', format: 'excel' }, { headers: { 'X-CSRF-Token': null } });
  assert.equal(noCsrf.status, 403);
  const badFormat = await state.manager.post('/api/export', { reportType: 'Products', format: 'exe' });
  assert.equal(badFormat.status, 400);

  const history = await state.manager.ok('export:getHistory');
  assert.ok(history.some((h) => h.action === 'Export XLSX' && h.performedBy === 'maria'));
});

test('settings: company-wide for admins, personal values per user', async () => {
  const repCompany = await state.rep.call('settings:save', ['himmel_company_info', '{"name":"Hacked"}', 'Company']);
  assert.equal(repCompany.status, 403);

  await state.admin.ok('settings:save', ['himmel_company_info', '{"name":"Himmel Pharmaceutical"}', 'Company']);
  const company = await state.rep.ok('settings:getByKey', ['himmel_company_info']);
  assert.equal(company.value, '{"name":"Himmel Pharmaceutical"}');

  await state.rep.ok('settings:save', ['himmel_account_info', '{"fullName":"Rafay"}', 'Account']);
  await state.manager.ok('settings:save', ['himmel_account_info', '{"fullName":"Maria"}', 'Account']);
  assert.equal((await state.rep.ok('settings:getByKey', ['himmel_account_info'])).value, '{"fullName":"Rafay"}');
  assert.equal((await state.manager.ok('settings:getByKey', ['himmel_account_info'])).value, '{"fullName":"Maria"}');

  const all = await state.rep.ok('settings:getAll');
  assert.equal(all.himmel_account_info, '{"fullName":"Rafay"}');
  assert.ok(!Object.keys(all).some((k) => k.startsWith('user:')));

  assert.equal(await state.rep.ok('settings:getByKey', ['does_not_exist']), null);
});

test('maintenance mode blocks non-admin logins', async () => {
  await state.admin.ok('settings:save', ['maintenance_mode', 'true', 'general']);
  const blocked = await anonymous().call('auth:login', [{ username: 'rafay', password: 'RepPass#2026' }]);
  assert.match(blocked.error, /under maintenance/);
  const wrongPassword = await anonymous().call('auth:login', [{ username: 'rafay', password: 'not-the-password' }]);
  assert.equal(wrongPassword.error, 'Invalid username or password.', 'no account details without the password');
  await state.admin.ok('settings:save', ['maintenance_mode', 'false', 'general']);
  state.rep = await login('rafay', 'RepPass#2026');
});

test('tasks and reminders are private to each user', async () => {
  const task = await state.rep.ok('tasks:save', [{ text: 'Visit Mayo Hospital', done: false }]);
  await state.rep.ok('tasks:save', [{ ...task, done: true }]);
  assert.deepEqual(await state.rep.ok('tasks:getAll'), [{ id: task.id, text: 'Visit Mayo Hospital', done: 1 }]);
  assert.deepEqual(await state.manager.ok('tasks:getAll'), []);

  await state.manager.ok('tasks:delete', [task.id]); // not theirs: no effect
  assert.equal((await state.rep.ok('tasks:getAll')).length, 1);

  const reminder = await state.manager.ok('reminders:save', [{ title: 'Sales review', time: 'Today, 2:00 PM', type: 'meeting' }]);
  assert.equal((await state.manager.ok('reminders:getAll'))[0].id, reminder.id);
  assert.deepEqual(await state.rep.ok('reminders:getAll'), []);
});

test('audit trail records who did what, from where', async () => {
  const { logs, total } = await state.admin.ok('auditLogs:getAll', [{ module: 'Orders', limit: 50 }]);
  assert.ok(total >= 5);
  assert.ok(logs.some((l) => l.action === 'Price Override' && l.performedBy === 'rafay'));
  assert.ok(logs.some((l) => l.action === 'Sale Completed'));
  assert.ok(logs.every((l) => l.ipOrDevice), 'client address recorded');
  const one = await state.admin.ok('auditLogs:getById', [logs[0].id]);
  assert.equal(one.id, logs[0].id);

  const capped = await state.admin.ok('auditLogs:getAll', [{ limit: 1000000 }]);
  assert.ok(capped.logs.length <= 500, 'page size is capped');
});

test('integrity check and diagnostics', async () => {
  const report = await state.admin.ok('integrity:check');
  assert.equal(report.healthy, true, JSON.stringify(report.reports));
  assert.equal(report.audit.orders.total, 2);
  const diag = await state.admin.ok('diagnostics:get');
  assert.equal(diag.databaseAvailable, true);
  assert.equal(diag.counts.users, 3);
});

test('backups download and restore gzipped, and need the admin password again', async () => {
  const wrong = await state.admin.post('/api/backup/download', { password: 'not-my-password' });
  assert.equal(wrong.status, 403);
  assert.match((await wrong.json()).error, /Incorrect password/);
  assert.equal((await state.manager.post('/api/backup/download', { password: 'Manager#2026' })).status, 403);
  assert.equal((await anonymous().post('/api/backup/download', { password: ADMIN_PASSWORD })).status, 401);

  const res = await state.admin.post('/api/backup/download', { password: ADMIN_PASSWORD });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'application/gzip');
  assert.match(res.headers.get('content-disposition'), /Himmel_Backup_\d{4}-\d{2}-\d{2}\.json\.gz/);
  const snapshot = JSON.parse(zlib.gunzipSync(Buffer.from(await res.arrayBuffer())).toString('utf8'));
  assert.equal(snapshot.format, 'himmel-cloud-backup');
  assert.ok(!snapshot.tables.users, 'login accounts are not part of in-app backups');
  assert.ok(!snapshot.tables.sessions, 'sessions are not part of backups');
  assert.equal(snapshot.tables.orders.rows.length, 2);

  // Change data, then restore the backup (sent gzipped, like the browser does).
  await state.admin.ok('areas:save', [{ name: 'Temporary Area' }]);
  const restoreBody = (password, snap = snapshot) => zlib.gzipSync(JSON.stringify({ password, snapshot: snap, fileName: 'test.json.gz' }));
  const restoreHeaders = { 'Content-Encoding': 'gzip' };

  const badPassword = await state.admin.post('/api/backup/restore', null, { raw: restoreBody('nope'), headers: restoreHeaders });
  assert.equal(badPassword.status, 403);

  const restored = await state.admin.post('/api/backup/restore', null, { raw: restoreBody(ADMIN_PASSWORD), headers: restoreHeaders });
  assert.equal(restored.status, 200);
  assert.equal((await restored.json()).data.counts.orders, 2);

  const areas = await state.admin.ok('areas:getAll');
  assert.ok(!areas.some((a) => a.name === 'Temporary Area'));
  const orders = await state.admin.ok('orders:getAll');
  assert.equal(orders.find((o) => o.orderNumber === 'PO-2026-001').totalAmount, 45000);

  // Identity sequences continue after the highest restored id.
  const area = await state.admin.ok('areas:save', [{ name: 'After Restore' }]);
  assert.ok(area.id > Math.max(...snapshot.tables.areas.rows.map((r) => r[0])));
  assert.equal((await state.rep.ok('tasks:getAll')).length, 1, 'task owners kept');

  const repRestore = await state.rep.post('/api/backup/restore', null, { raw: restoreBody('RepPass#2026'), headers: restoreHeaders });
  assert.equal(repRestore.status, 403);
  const anonymousRestore = await anonymous().post('/api/backup/restore', null, { raw: restoreBody(ADMIN_PASSWORD), headers: restoreHeaders });
  assert.equal(anonymousRestore.status, 401, 'upload refused before it is read');
  const invalid = await state.admin.post('/api/backup/restore', null, { raw: restoreBody(ADMIN_PASSWORD, { hello: 'world' }), headers: restoreHeaders });
  assert.match((await invalid.json()).error, /Invalid Backup File/);

  const history = await state.admin.ok('backup:getHistory');
  // The audit trail itself is rolled back to the backup's moment, then the restore is recorded.
  assert.equal(history[0].action, 'Restore');
});

test('emergency recovery stays disabled until an admin sets it up, then needs its own session', async () => {
  const notConfigured = await anonymous().call('auth:recoveryVerifyPassword', ['Recovery@123']);
  assert.match(notConfigured.error, /not set up yet/);
  const noSession = await anonymous().call('auth:recoveryGetUsers');
  assert.equal(noSession.status, 401);
  assert.equal((await anonymous().call('auth:getSecurityStatus')).status, 401, 'no longer public');

  const repChange = await state.rep.call('auth:changeRecoveryPassword', [{ currentPassword: 'Recovery@123', newPassword: 'Rescue#Pass99' }]);
  assert.equal(repChange.status, 403);
  await state.admin.ok('auth:changeRecoveryPassword', [{ currentPassword: 'Recovery@123', newPassword: 'Rescue#Pass99' }]);
  const shortPin = await state.admin.call('auth:changeRecoveryPin', [{ currentAuth: 'Rescue#Pass99', newPin: '4829' }]);
  assert.match(shortPin.error, /6 to 8/);
  await state.admin.ok('auth:changeRecoveryPin', [{ currentAuth: 'Rescue#Pass99', newPin: '482916' }]);

  const status = await state.admin.ok('auth:getSecurityStatus');
  assert.equal(status.hasRecoveryPassword, true);
  assert.equal(status.hasRecoveryPin, true);
  assert.deepEqual(await state.rep.ok('auth:getSecurityStatus'), { isFirstLoginPending: false });

  const wrong = await anonymous().call('auth:recoveryVerifyPassword', ['nope']);
  assert.equal(wrong.error, 'Invalid emergency recovery password.');

  const rescuer = new Client();
  const verified = await rescuer.ok('auth:recoveryVerifyPassword', ['Rescue#Pass99']);
  assert.ok(verified.csrfToken);
  assert.ok(rescuer.cookies.has(config.cookies.recovery), 'recovery session cookie set');
  const users = await rescuer.ok('auth:recoveryGetUsers', [], { csrf: verified.csrfToken });
  assert.equal(users.length, 3);
  assert.equal((await rescuer.call('auth:recoveryGetUsers', [], { csrf: 'forged' })).status, 403);

  const pinClient = new Client();
  const pin = await pinClient.ok('auth:verifyRecoveryPin', [{ pin: '482916' }]);
  const weakReset = await pinClient.call('auth:recoveryResetUserPassword', [{ username: 'maria', newPassword: 'weak', confirmPassword: 'weak' }], { csrf: pin.csrfToken });
  assert.match(weakReset.error, /security policy/);
  await pinClient.ok('auth:recoveryResetUserPassword', [{ username: 'maria', newPassword: 'Fresh#Start2026', confirmPassword: 'Fresh#Start2026' }], { csrf: pin.csrfToken });

  // Resetting the password signs that user out everywhere.
  const oldSession = await state.manager.call('products:getAll');
  assert.equal(oldSession.status, 401);
  state.manager = await login('maria', 'Fresh#Start2026');

  // An ordinary sign-in is not a recovery session.
  const misuse = await state.admin.call('auth:recoveryGetUsers');
  assert.equal(misuse.status, 401);
});

test('logging out ends the session on the server', async () => {
  const laptop = await login('rafay', 'RepPass#2026');
  const stolenCookie = new Map(laptop.cookies);
  const csrf = laptop.csrf;
  await laptop.ok('auth:logout');
  assert.ok(!laptop.cookies.has(config.cookies.session), 'cookie cleared');

  const replay = new Client();
  replay.cookies = stolenCookie;
  replay.csrf = csrf;
  assert.equal((await replay.call('orders:getAll')).status, 401, 'a copied cookie no longer works');
});

test('idle sessions expire on the server', async () => {
  const idle = await login('rafay', 'RepPass#2026');
  await getDb().run("UPDATE sessions SET last_seen_at = now() - interval '2 hours' WHERE id_hash IN (SELECT id_hash FROM sessions ORDER BY created_at DESC LIMIT 1)");
  const res = await idle.call('orders:getAll');
  assert.equal(res.status, 401);
  assert.match(res.error, /inactivity/);
});

test('disabling a user or changing a password ends their other sessions', async () => {
  await state.admin.ok('auth:disableUser', [{ username: 'rafay' }]);
  const disabled = await state.rep.call('orders:getAll');
  assert.equal(disabled.status, 401);
  const disabledLogin = await anonymous().call('auth:login', [{ username: 'rafay', password: 'RepPass#2026' }]);
  assert.match(disabledLogin.error, /disabled/);
  await state.admin.ok('auth:activateUser', [{ username: 'rafay' }]);
  state.rep = await login('rafay', 'RepPass#2026');

  const otherComputer = await login('rafay', 'RepPass#2026');
  const oldCsrf = state.rep.csrf;
  const weak = await state.rep.call('auth:changePassword', [{ oldPassword: 'RepPass#2026', newPassword: 'short' }]);
  assert.match(weak.error, /security policy/);
  const same = await state.rep.call('auth:changePassword', [{ oldPassword: 'RepPass#2026', newPassword: 'RepPass#2026' }]);
  assert.match(same.error, /different/);
  const changed = await state.rep.call('auth:changePassword', [{ oldPassword: 'RepPass#2026', newPassword: 'NewRep#2026x' }]);
  assert.equal(changed.success, true);
  assert.notEqual(state.rep.csrf, oldCsrf, 'the browser that changed the password gets a new session and token');
  assert.equal((await otherComputer.call('orders:getAll')).status, 401);
  assert.equal((await state.rep.call('orders:getAll')).success, true);
});

test('the last active administrator cannot be removed', async () => {
  const res = await state.admin.call('auth:disableUser', [{ username: 'admin' }]);
  assert.match(res.error, /last active administrator/);
  const demote = await state.admin.call('auth:changeRole', [{ username: 'admin', role: 'Manager' }]);
  assert.match(demote.error, /last active administrator/);
  const del = await state.admin.call('auth:deleteUser', ['admin']);
  assert.match(del.error, /cannot be deleted/);
});

test('account locks after five wrong passwords', async () => {
  await state.admin.ok('auth:createUser', [{ username: 'lockme', password: 'Padlock#2026x', fullName: 'Lock Me', role: 'Rep' }]);
  for (let i = 0; i < 4; i++) {
    const r = await anonymous().call('auth:login', [{ username: 'lockme', password: 'wrong' }]);
    assert.equal(r.error, 'Invalid username or password.');
  }
  const fifth = await anonymous().call('auth:login', [{ username: 'lockme', password: 'wrong' }]);
  assert.match(fifth.error, /Account locked/);
  const correct = await anonymous().call('auth:login', [{ username: 'lockme', password: 'Padlock#2026x' }]);
  assert.match(correct.error, /temporarily locked/);

  // An administrator can unlock it (managers cannot).
  assert.equal((await state.manager.call('auth:unlockUser', [{ username: 'lockme' }])).status, 403);
  await state.admin.ok('auth:unlockUser', [{ username: 'lockme' }]);
  assert.equal((await anonymous().call('auth:login', [{ username: 'lockme', password: 'Padlock#2026x' }])).success, true);

  // An administrator's password reset also clears a lock.
  for (let i = 0; i < 5; i++) await anonymous().call('auth:login', [{ username: 'lockme', password: 'wrong' }]);
  await state.admin.ok('auth:resetPassword', [{ username: 'lockme', newPassword: 'Unlocked#2026' }]);
  assert.equal((await anonymous().call('auth:login', [{ username: 'lockme', password: 'Unlocked#2026' }])).success, true);
});

test('administrators are asked to finish the security setup until it is done', async () => {
  assert.equal((await state.admin.ok('auth:getSecurityStatus')).isFirstLoginPending, true);
  const oldCsrf = state.admin.csrf;
  await state.admin.ok('auth:completeFirstLoginWizard', [{
    newUsername: 'admin', newPassword: 'Stronger#Chief2026', recoveryPassword: 'Rescue#Pass2026', recoveryPin: '736251'
  }]);
  assert.notEqual(state.admin.csrf, oldCsrf, 'new credentials, new session');
  assert.equal((await state.admin.ok('auth:getSecurityStatus')).isFirstLoginPending, false);
  const again = await state.admin.call('auth:completeFirstLoginWizard', [{ newUsername: 'admin', newPassword: 'Another#Chief2026', recoveryPassword: 'Rescue#Pass2027', recoveryPin: '736252' }]);
  assert.match(again.error, /already been completed/);
});
