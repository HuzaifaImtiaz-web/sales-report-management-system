// Unit checks for the security building blocks that do not need a database.
const fs = require('fs');
const path = require('path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

process.env.HIMMEL_SKIP_ENV_FILE = '1';
const security = require('../src/http/security');
const { passwordProblems, isStrongPassword } = require('../src/auth/passwordPolicy');

test('password policy', () => {
  assert.ok(isStrongPassword('Correct#Horse9'));
  assert.ok(isStrongPassword('Himmel-Sales-2026'));
  assert.deepEqual(passwordProblems('short'), [
    'Must be at least 10 characters.',
    'Must contain at least one uppercase letter.',
    'Must contain at least one number.',
    'Must contain at least one special character.'
  ]);
  assert.ok(passwordProblems('Password123!').some((p) => /too common/.test(p)));
  assert.ok(passwordProblems('Maria#Secure1', { username: 'maria' }).some((p) => /username/.test(p)));
  assert.ok(passwordProblems(`A1#${'x'.repeat(80)}`).some((p) => /at most 72/.test(p)), 'bcrypt would truncate it');
  assert.ok(passwordProblems(undefined).length > 0);
});

function mockRes() {
  const headers = {};
  return {
    headers,
    statusCode: 200,
    body: null,
    setHeader(name, value) { headers[name.toLowerCase()] = value; },
    getHeader(name) { return headers[name.toLowerCase()]; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test('session cookies are HttpOnly, SameSite=Strict and Secure in production', () => {
  const res = mockRes();
  security.setCookie(res, '__Host-himmel_sid', 'abc', { maxAgeMs: 3600000, secure: true });
  const [cookie] = res.headers['set-cookie'];
  assert.match(cookie, /^__Host-himmel_sid=abc; Path=\/; HttpOnly; SameSite=Strict; Secure; Max-Age=3600$/);

  security.clearCookie(res, '__Host-himmel_sid', { secure: true });
  assert.equal(res.headers['set-cookie'].length, 1, 'replaces the earlier cookie of the same name');
  assert.match(res.headers['set-cookie'][0], /Max-Age=0/);
});

test('cookie parsing ignores duplicates and malformed parts', () => {
  const cookies = security.parseCookies({ headers: { cookie: 'a=1; b=two%20words; a=evil; junk; c=' } });
  assert.deepEqual(cookies, { a: '1', b: 'two words', c: '' });
});

function originCheck(options, headers, { method = 'POST', host = 'sales.example.com', protocol = 'https' } = {}) {
  const res = mockRes();
  let passed = false;
  const req = {
    method,
    protocol,
    get(name) {
      if (name.toLowerCase() === 'host') return host;
      return headers[name.toLowerCase()];
    }
  };
  security.sameOriginOnly(options)(req, res, () => { passed = true; });
  return passed ? 'pass' : res.statusCode;
}

test('cross-site requests are rejected', () => {
  assert.equal(originCheck({}, { origin: 'https://sales.example.com' }), 'pass');
  assert.equal(originCheck({}, {}), 'pass', 'non-browser clients send no Origin');
  assert.equal(originCheck({}, { origin: 'https://evil.example' }), 403);
  assert.equal(originCheck({}, { origin: 'http://sales.example.com' }), 403, 'scheme must match too');
  assert.equal(originCheck({}, { 'sec-fetch-site': 'cross-site' }), 403);
  assert.equal(originCheck({}, { 'sec-fetch-site': 'same-site', origin: 'https://sales.example.com' }), 403, 'a sibling subdomain is not the same origin');
  assert.equal(originCheck({}, { origin: 'https://evil.example' }, { method: 'GET' }), 'pass', 'GET never changes data');

  const configured = { allowedOrigins: ['https://sales.example.com'] };
  assert.equal(originCheck(configured, { origin: 'https://sales.example.com' }, { host: 'internal-host:4000', protocol: 'http' }), 'pass');
  assert.equal(originCheck(configured, { origin: 'https://other.example.com' }), 403);
});

test('vercel.json sends the same security headers as the server', () => {
  const vercelFile = path.join(__dirname, '..', '..', 'vercel.json');
  const vercel = JSON.parse(fs.readFileSync(vercelFile, 'utf8'));
  const pageRule = vercel.headers.find((h) => h.source === '/(.*)');
  assert.ok(pageRule, 'vercel.json has a catch-all headers rule');
  const fromVercel = Object.fromEntries(pageRule.headers.map((h) => [h.key, h.value]));
  assert.deepEqual(fromVercel, security.PAGE_HEADERS);
});
