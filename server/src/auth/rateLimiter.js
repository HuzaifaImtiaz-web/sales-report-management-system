const { RateLimitError } = require('../errors');

// Fixed-window counters kept in memory (per server instance), enough to slow down password guessing.
const buckets = new Map();

function getBucket(key, windowMs) {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  return bucket;
}

function limitError(bucket) {
  const minutes = Math.max(1, Math.ceil((bucket.resetAt - Date.now()) / 60000));
  return new RateLimitError(`Too many attempts from this computer. Please try again in ${minutes} minute(s).`);
}

// Throws when the limit is already reached (does not count this attempt).
function check(key, { max, windowMs }) {
  const bucket = getBucket(key, windowMs);
  if (bucket.count >= max) throw limitError(bucket);
}

// Counts one attempt.
function hit(key, { windowMs }) {
  getBucket(key, windowMs).count += 1;
}

function reset() {
  buckets.clear();
}

const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60 * 1000);
cleanup.unref();

module.exports = { check, hit, reset };
