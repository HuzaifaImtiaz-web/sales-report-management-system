const { RateLimitError } = require('../errors');

// Fixed-window attempt counters stored in the database, so every server instance (serverless
// hosting runs many) sees the same numbers. Used for sign-in and emergency recovery.

function limitError(resetAt) {
  const minutes = Math.max(1, Math.ceil((new Date(resetAt).getTime() - Date.now()) / 60000));
  return new RateLimitError(`Too many attempts. Please try again in ${minutes} minute(s).`);
}

/** Throws when the limit is already reached (does not count this attempt). */
async function check(db, key, { max }) {
  const row = await db.get('SELECT count, reset_at FROM rate_limits WHERE key = ? AND reset_at > now()', [key]);
  if (row && row.count >= max) throw limitError(row.reset_at);
}

/** Counts one attempt and returns the new count. */
async function hit(db, key, { windowMs }) {
  const seconds = Math.max(1, Math.round(windowMs / 1000));
  const row = await db.get(`
    INSERT INTO rate_limits (key, count, reset_at)
    VALUES (?, 1, now() + make_interval(secs => ?))
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.reset_at <= now() THEN 1 ELSE rate_limits.count + 1 END,
      reset_at = CASE WHEN rate_limits.reset_at <= now() THEN now() + make_interval(secs => ?) ELSE rate_limits.reset_at END
    RETURNING count, reset_at
  `, [key, seconds, seconds]);

  if (Math.random() < 0.02) {
    db.run("DELETE FROM rate_limits WHERE reset_at < now() - interval '1 hour'").catch(() => {});
  }
  return row;
}

/** Counts one attempt and throws when this attempt goes over the limit. */
async function consume(db, key, limit) {
  const row = await hit(db, key, limit);
  if (row.count > limit.max) throw limitError(row.reset_at);
}

async function reset(db, key) {
  await db.run('DELETE FROM rate_limits WHERE key = ?', [key]);
}

module.exports = { check, hit, consume, reset };
