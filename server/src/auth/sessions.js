const crypto = require('crypto');
const config = require('../config');
const { AuthError } = require('../errors');

// Server-side sessions. The browser holds a random 256-bit token in an HttpOnly cookie; the
// database keeps only its SHA-256 hash. Every request looks the session up, so signing out,
// disabling an account or changing a password takes effect immediately.

const TOUCH_INTERVAL_MS = 60 * 1000;

const newToken = () => crypto.randomBytes(32).toString('base64url');
const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && left.length > 0 && crypto.timingSafeEqual(left, right);
}

/**
 * Creates a session and returns { token, csrfToken, expiresAt } (token goes into the cookie).
 */
async function createSession(db, { kind = 'user', user = null, ip = null, userAgent = null } = {}) {
  const token = newToken();
  const csrfToken = newToken();
  const ttl = kind === 'recovery' ? config.session.recoveryTtlMs : config.session.ttlMs;
  const expiresAt = new Date(Date.now() + ttl);

  await db.run(`
    INSERT INTO sessions (id_hash, kind, user_id, session_version, csrf_token, expires_at, ip, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    hashToken(token), kind, user ? user.id : null, user ? user.sessionVersion || 0 : 0,
    csrfToken, expiresAt.toISOString(), ip ? String(ip).slice(0, 64) : null,
    userAgent ? String(userAgent).slice(0, 255) : null
  ]);

  // Housekeeping now and then instead of a scheduled job (serverless hosts have no cron by default).
  if (Math.random() < 0.05) {
    db.run("DELETE FROM sessions WHERE expires_at < now() - interval '1 day'").catch(() => {});
  }
  return { token, csrfToken, expiresAt };
}

/**
 * Returns { session, user } for a valid user session token, or throws AuthError.
 */
async function getUserSession(db, token) {
  if (!token) throw new AuthError();
  const row = await db.get(`
    SELECT s.id_hash, s.csrf_token, s.session_version AS s_version, s.created_at, s.last_seen_at, s.expires_at,
           u.id, u.username, u.full_name, u.role, u.is_active, u.session_version AS u_version
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id_hash = ? AND s.kind = 'user'
  `, [hashToken(token)]);

  if (!row) throw new AuthError();

  const now = Date.now();
  const expired = new Date(row.expires_at).getTime() <= now;
  const idle = now - new Date(row.last_seen_at).getTime() > config.session.idleMs;
  if (expired || idle || row.is_active !== 1 || row.s_version !== row.u_version) {
    await db.run('DELETE FROM sessions WHERE id_hash = ?', [row.id_hash]);
    throw new AuthError(idle && !expired
      ? 'Session expired due to inactivity. Please log in again.'
      : undefined);
  }

  if (now - new Date(row.last_seen_at).getTime() > TOUCH_INTERVAL_MS) {
    await db.run('UPDATE sessions SET last_seen_at = now() WHERE id_hash = ?', [row.id_hash]);
  }

  return {
    session: {
      idHash: row.id_hash,
      csrfToken: row.csrf_token,
      createdAt: new Date(row.created_at).toISOString()
    },
    user: {
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      role: row.role,
      isActive: row.is_active === 1
    }
  };
}

/** Returns the recovery session for a token, or throws AuthError with a recovery-specific message. */
async function getRecoverySession(db, token) {
  const message = 'The recovery session has expired. Please enter the recovery password or PIN again.';
  if (!token) throw new AuthError(message);
  const row = await db.get(
    "SELECT id_hash, csrf_token, expires_at FROM sessions WHERE id_hash = ? AND kind = 'recovery'",
    [hashToken(token)]
  );
  if (!row || new Date(row.expires_at).getTime() <= Date.now()) {
    if (row) await db.run('DELETE FROM sessions WHERE id_hash = ?', [row.id_hash]);
    throw new AuthError(message);
  }
  return { idHash: row.id_hash, csrfToken: row.csrf_token };
}

async function deleteSessionByHash(db, idHash) {
  await db.run('DELETE FROM sessions WHERE id_hash = ?', [idHash]);
}

async function deleteSession(db, token) {
  if (token) await deleteSessionByHash(db, hashToken(token));
}

/** Ends every session of a user (e.g. after an emergency recovery password reset). */
async function deleteUserSessions(db, userId) {
  await db.run('DELETE FROM sessions WHERE user_id = ?', [userId]);
}

module.exports = {
  createSession,
  getUserSession,
  getRecoverySession,
  deleteSession,
  deleteSessionByHash,
  deleteUserSessions,
  hashToken,
  safeEqual
};
