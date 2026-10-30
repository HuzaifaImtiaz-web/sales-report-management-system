// Moves a database made by the old desktop app (test/fixtures/legacy-*.sqlite, created with the
// original SQLite code) into PostgreSQL with scripts/import-from-sqlite.js, then checks the result
// through the API against the figures the SQLite version produced (legacy-expected.json).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { execFile } = require('child_process');
const { PGlite } = require('@electric-sql/pglite');
const { PGLiteSocketServer } = require('@electric-sql/pglite-socket');

const fixtures = path.join(__dirname, 'fixtures');
const expected = require('./fixtures/legacy-expected.json');
const script = path.join(__dirname, '..', 'scripts', 'import-from-sqlite.js');

let pglite;
let socketServer;
let httpServer;
let baseUrl;
let env;
let closeDb;

function runImport(args) {
  return new Promise((resolve, reject) => {
    execFile(process.execPath, [script, ...args], { env, encoding: 'utf8' }, (err, stdout, stderr) => {
      if (err) reject(new Error(`${stdout}\n${stderr}`));
      else resolve(stdout);
    });
  });
}

// session: { cookie, csrf } from login() (the browser keeps the cookie, the page the CSRF token).
async function call(channel, args = [], session) {
  const headers = { 'Content-Type': 'application/json' };
  if (session) {
    headers.Cookie = session.cookie;
    headers['X-CSRF-Token'] = session.csrf;
  }
  const res = await fetch(`${baseUrl}/api/rpc/${encodeURIComponent(channel)}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ args })
  });
  const body = await res.json();
  if (!body.success) throw new Error(`${channel}: ${body.error}`);
  const cookie = res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  if (cookie && body.data && body.data.csrfToken) {
    return { ...body.data, session: { cookie, csrf: body.data.csrfToken } };
  }
  return body.data;
}

async function login(username, password) {
  return (await call('auth:login', [{ username, password }])).session;
}

before(async () => {
  pglite = await PGlite.create();
  socketServer = new PGLiteSocketServer({ db: pglite, port: 0, host: '127.0.0.1', maxConnections: 10 });
  await socketServer.start();

  env = {
    ...process.env,
    DATABASE_URL: `postgres://postgres:postgres@127.0.0.1:${socketServer.server.address().port}/postgres`,
    HIMMEL_SKIP_ENV_FILE: '1',
    NODE_ENV: 'test',
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: 'Bootstrap#2026',
    TRUST_PROXY: '0'
  };
  Object.assign(process.env, env);
});

after(async () => {
  if (httpServer) await new Promise((resolve) => httpServer.close(resolve));
  if (closeDb) await closeDb();
  if (socketServer) await socketServer.stop();
  if (pglite) await pglite.close();
});

const dataArgs = ['--data', path.join(fixtures, 'legacy-admin.sqlite'), '--users', path.join(fixtures, 'legacy-users.sqlite'), '--owner', 'admin'];

test('preview lists the rows without writing anything', async () => {
  const out = await runImport(dataArgs);
  assert.match(out, /Preview only/);
  assert.match(out, /orders\s+4 rows/);
});

test('import replaces the cloud data with the old desktop data', async () => {
  const out = await runImport([...dataArgs, '--yes']);
  assert.match(out, /Import finished/);

  const { start } = require('../src/index');
  closeDb = require('../src/db').closeDb;
  httpServer = (await start({ port: 0, host: '127.0.0.1' })).server;
  baseUrl = `http://127.0.0.1:${httpServer.address().port}`;
});

test('old usernames and passwords work, disabled accounts stay disabled', async () => {
  await call('auth:login', [{ username: 'admin', password: 'Legacy#Admin1' }]);
  await call('auth:login', [{ username: 'Sara', password: 'Legacy#Sara1' }]);
  await assert.rejects(call('auth:login', [{ username: 'olduser', password: 'Legacy#Old1' }]), /disabled/);
  await assert.rejects(call('auth:login', [{ username: 'admin', password: 'Bootstrap#2026' }]), /Username or password is incorrect/);
});

test('row counts, order totals and report figures match the SQLite version', async () => {
  const admin = await login('admin', 'Legacy#Admin1');

  const health = await call('integrity:check', [], admin);
  for (const [table, count] of Object.entries(expected.counts)) {
    if (health.audit[table]) assert.equal(health.audit[table].total, count, table);
  }

  const orders = await call('orders:getAll', [], admin);
  for (const exp of expected.totals) {
    const got = orders.find((o) => o.orderNumber === exp.order_number);
    assert.equal(got.totalAmount, exp.total_amount, exp.order_number);
    assert.equal(got.status, exp.status);
    assert.equal(got.createdAt, exp.created_at);
  }

  const achievements = await call('reports:getTargetAchievementData', [{}], admin);
  assert.equal(achievements.length, expected.achievements.length);
  for (const exp of expected.achievements) {
    const got = achievements.find((a) => a.teamMemberName === exp.team_member_name && a.productName === exp.product_name);
    assert.ok(got, `${exp.team_member_name} / ${exp.product_name}`);
    assert.equal(got.targetQty, exp.target_qty);
    assert.equal(got.actualQty, exp.actual_qty);
    assert.equal(got.actualValue, exp.actual_value);
    assert.equal(got.qtyAchievementPercent, exp.qty_achievement_percent);
    assert.equal(got.valueAchievementPercent, exp.value_achievement_percent);
  }

  const trend = await call('reports:getSalesTrendData', [{}], admin);
  assert.deepEqual(trend, expected.monthly.map((m) => ({ month: m.sales_month, orders: m.total_orders, sales: m.total_sales })));

  const team = await call('reports:getTeamContributionData', [{}], admin);
  for (const exp of expected.team) {
    const got = team.find((t) => t.teamMemberName === exp.team_member_name);
    assert.equal(got.totalOrders, exp.total_orders);
    assert.equal(got.completedOrders, exp.completed_orders);
    assert.equal(got.totalSalesValue, exp.total_sales_value);
  }
});

test('owner-less data goes to the account that owned the old database', async () => {
  const admin = await login('admin', 'Legacy#Admin1');
  const sara = await login('sara', 'Legacy#Sara1');

  assert.equal((await call('tasks:getAll', [], admin)).length, 2);
  assert.equal((await call('tasks:getAll', [], sara)).length, 0);
  assert.match((await call('settings:getByKey', ['himmel_account_info'], admin)).value, /Legacy Admin/);
  assert.equal(await call('settings:getByKey', ['himmel_account_info'], sara), null);
  assert.equal((await call('settings:getByKey', ['backup_schedule'], sara)).value, 'weekly');
});

test('recovery credentials are kept and new rows continue after the imported ids', async () => {
  assert.ok((await call('auth:recoveryVerifyPassword', ['Legacy#Recovery1'])).csrfToken);
  assert.ok((await call('auth:verifyRecoveryPin', [{ pin: '7391' }])).csrfToken, 'PINs from the desktop app keep working');

  const admin = await login('admin', 'Legacy#Admin1');
  const area = await call('areas:save', [{ name: 'New Area After Import' }], admin);
  assert.equal(area.id, expected.counts.areas + 1);

  const order = await call('orders:save', [{
    orderNumber: 'PO-NEW-1', orderDate: '2026-10-01', teamMemberId: 1, areaId: 1,
    items: [{ productId: 1, quantity: 2, unitPrice: 4500 }]
  }], admin);
  assert.equal(order.id, expected.counts.orders + 1);
  assert.equal(order.totalAmount, 9000);
});
