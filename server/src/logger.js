// Console logger with the same API and password masking as electron/logger.cjs.
// Hosting platforms (Render, Railway, Fly.io...) collect stdout/stderr as the server log.

function sanitize(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/(["']?(?:password|passwordHash|oldPassword|newPassword|confirmPassword|currentPassword|recoveryPassword|recoveryPin|pin)["']?\s*:\s*["'])([^"']+)(["'])/gi, '$1[REDACTED]$3')
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/g, '$1[REDACTED]');
}

function write(level, message, error) {
  const line = `[${new Date().toISOString()}] [${level}] ${sanitize(String(message))}`;
  const out = level === 'ERROR' || level === 'WARN' ? console.error : console.log;
  out(line);
  if (error) {
    out(sanitize(String(error.stack || error.message || error)));
  }
}

module.exports = {
  info: (message) => write('INFO', message),
  warn: (message, error) => write('WARN', message, error),
  error: (message, error) => write('ERROR', message, error),
  debug: (message) => {
    if (process.env.LOG_LEVEL === 'debug') write('DEBUG', message);
  }
};
