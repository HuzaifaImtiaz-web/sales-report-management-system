const { test } = require('node:test');
const assert = require('node:assert/strict');
const rateLimiter = require('../src/auth/rateLimiter');

test('blocks after the limit is reached and only counts recorded hits', () => {
  rateLimiter.reset();
  const opts = { max: 3, windowMs: 60000 };
  for (let i = 0; i < 3; i++) {
    rateLimiter.check('login:1.2.3.4', opts); // successful logins never call hit()
  }
  for (let i = 0; i < 3; i++) {
    rateLimiter.check('login:1.2.3.4', opts);
    rateLimiter.hit('login:1.2.3.4', opts);
  }
  assert.throws(() => rateLimiter.check('login:1.2.3.4', opts), /Too many attempts/);
  rateLimiter.check('login:5.6.7.8', opts); // other addresses are not affected
});

test('the window resets', async () => {
  rateLimiter.reset();
  const opts = { max: 1, windowMs: 50 };
  rateLimiter.hit('k', opts);
  assert.throws(() => rateLimiter.check('k', opts));
  await new Promise((r) => setTimeout(r, 80));
  rateLimiter.check('k', opts);
});
