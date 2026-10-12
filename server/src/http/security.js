// HTTP hardening shared by the API and the static web app: security headers, cookie helpers,
// cross-site request checks and a coarse per-IP request limiter.
// vercel.json repeats PAGE_HEADERS for the static files Vercel serves itself
// (server/test/security.test.js checks the two stay identical).

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  // React and the chart library set inline style attributes.
  "style-src 'self' 'unsafe-inline'",
  // data:/blob: for the uploaded company logo and downloaded export previews.
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests'
].join('; ');

const COMMON_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-DNS-Prefetch-Control': 'off'
};

const HSTS = 'max-age=63072000; includeSubDomains';

// Headers for the web app's pages and files.
const PAGE_HEADERS = {
  ...COMMON_HEADERS,
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'Strict-Transport-Security': HSTS
};

// API responses are data, never pages: nothing may load, embed or cache them.
const API_HEADERS = {
  ...COMMON_HEADERS,
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Cache-Control': 'no-store',
  Pragma: 'no-cache'
};

function setHeaders(res, headers, { secure }) {
  for (const [name, value] of Object.entries(headers)) {
    if (name === 'Strict-Transport-Security' && !secure) continue;
    if (name === 'Content-Security-Policy' && !secure) {
      // Plain-HTTP development: the upgrade directive would break localhost.
      res.setHeader(name, value.replace(/;\s*upgrade-insecure-requests/, ''));
      continue;
    }
    res.setHeader(name, value);
  }
}

function apiHeaders({ secure }) {
  return (req, res, next) => {
    setHeaders(res, API_HEADERS, { secure });
    if (secure) res.setHeader('Strict-Transport-Security', HSTS);
    next();
  };
}

function pageHeaders({ secure }) {
  return (req, res, next) => {
    setHeaders(res, PAGE_HEADERS, { secure });
    next();
  };
}

// ─── Cookies ────────────────────────────────────────────────────────────────

function parseCookies(req) {
  const header = req.headers.cookie;
  const cookies = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const name = part.slice(0, idx).trim();
    if (!name || Object.prototype.hasOwnProperty.call(cookies, name)) continue;
    const raw = part.slice(idx + 1).trim();
    try {
      cookies[name] = decodeURIComponent(raw);
    } catch (e) {
      cookies[name] = raw;
    }
  }
  return cookies;
}

function serializeCookie(name, value, { maxAgeMs, secure, expire = false }) {
  const parts = [`${name}=${expire ? '' : encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Strict'];
  if (secure) parts.push('Secure');
  if (expire) {
    parts.push('Max-Age=0', 'Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  } else if (maxAgeMs) {
    parts.push(`Max-Age=${Math.floor(maxAgeMs / 1000)}`);
  }
  return parts.join('; ');
}

function appendSetCookie(res, cookie) {
  const existing = res.getHeader('Set-Cookie');
  const list = existing ? (Array.isArray(existing) ? existing : [existing]) : [];
  // Replace an earlier cookie with the same name set during this request.
  const name = cookie.slice(0, cookie.indexOf('='));
  res.setHeader('Set-Cookie', [...list.filter((c) => !c.startsWith(`${name}=`)), cookie]);
}

function setCookie(res, name, value, { maxAgeMs, secure }) {
  appendSetCookie(res, serializeCookie(name, value, { maxAgeMs, secure }));
}

function clearCookie(res, name, { secure }) {
  appendSetCookie(res, serializeCookie(name, '', { secure, expire: true }));
}

// ─── Cross-site request protection ──────────────────────────────────────────

function requestOrigin(req) {
  return `${req.protocol}://${req.get('host')}`.toLowerCase();
}

/**
 * Rejects state-changing requests sent by another website. Browsers always send Origin on POST
 * (and Sec-Fetch-Site in current versions); requests without them are not from a browser page.
 */
function sameOriginOnly({ allowedOrigins = [] } = {}) {
  const allowed = new Set(allowedOrigins.map((o) => o.toLowerCase()));
  return (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') return next();

    const fetchSite = req.get('sec-fetch-site');
    if (fetchSite && !['same-origin', 'none'].includes(fetchSite)) {
      return res.status(403).json({ success: false, error: 'Cross-site requests are not allowed.' });
    }

    const origin = req.get('origin');
    if (origin) {
      const normalized = origin.toLowerCase().replace(/\/+$/, '');
      const ok = allowed.size > 0 ? allowed.has(normalized) : normalized === requestOrigin(req);
      if (!ok) {
        return res.status(403).json({ success: false, error: 'Cross-site requests are not allowed.' });
      }
    }
    return next();
  };
}

/** Only JSON bodies are accepted (HTML forms cannot send them cross-site). */
function requireJson(req, res, next) {
  if (req.method !== 'POST') return next();
  if (!req.is('application/json')) {
    return res.status(415).json({ success: false, error: 'Requests must be sent as JSON.' });
  }
  return next();
}

// ─── Coarse request limiter ─────────────────────────────────────────────────

/**
 * Per-IP request budget kept in memory. On serverless hosting each instance counts separately,
 * so this only blunts floods; sign-in and recovery use the shared database counters instead.
 */
function requestLimiter({ max = 600, windowMs = 5 * 60 * 1000 } = {}) {
  const buckets = new Map();
  let lastSweep = Date.now();

  return (req, res, next) => {
    const now = Date.now();
    if (now - lastSweep > windowMs) {
      for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
      lastSweep = now;
    }
    const key = req.ip || 'unknown';
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({ success: false, error: 'Too many requests. Please slow down and try again shortly.' });
    }
    return next();
  };
}

module.exports = {
  PAGE_HEADERS,
  API_HEADERS,
  CONTENT_SECURITY_POLICY,
  apiHeaders,
  pageHeaders,
  parseCookies,
  setCookie,
  clearCookie,
  sameOriginOnly,
  requireJson,
  requestLimiter
};
