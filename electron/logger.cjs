const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const MAX_LOG_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_BACKUP_FILES = 3;

function getLogFilePath() {
  try {
    return path.join(app.getPath('userData'), 'app.log');
  } catch (e) {
    return path.join(process.cwd(), 'app-fallback.log');
  }
}

function sanitize(text) {
  if (typeof text !== 'string') return text;
  
  // Mask password properties in JSON or normal string lines
  return text
    .replace(/(["']?passwordHash["']?\s*:\s*["'])([^"']+)(["'])/gi, '$1[REDACTED]$3')
    .replace(/(["']?password["']?\s*:\s*["'])([^"']+)(["'])/gi, '$1[REDACTED]$3')
    .replace(/(["']?oldPassword["']?\s*:\s*["'])([^"']+)(["'])/gi, '$1[REDACTED]$3')
    .replace(/(["']?newPassword["']?\s*:\s*["'])([^"']+)(["'])/gi, '$1[REDACTED]$3')
    .replace(/(["']?confirmPassword["']?\s*:\s*["'])([^"']+)(["'])/gi, '$1[REDACTED]$3')
    .replace(/(Password123!)/g, '[REDACTED]');
}

function rotateLogs(logFilePath) {
  try {
    for (let i = MAX_BACKUP_FILES - 1; i >= 1; i--) {
      const source = logFilePath.replace('.log', `.${i}.log`);
      const dest = logFilePath.replace('.log', `.${i + 1}.log`);
      if (fs.existsSync(source)) {
        fs.renameSync(source, dest);
      }
    }
    const target = logFilePath.replace('.log', '.1.log');
    if (fs.existsSync(logFilePath)) {
      fs.renameSync(logFilePath, target);
    }
  } catch (err) {
    console.error('Log rotation failed:', err);
  }
}

function writeLog(level, message, error) {
  const timestamp = new Date().toISOString();
  let logText = `[${timestamp}] [${level}] ${sanitize(message)}\n`;
  if (error) {
    const errorString = error.stack || error.message || error;
    logText += `${sanitize(errorString)}\n`;
  }
  
  try {
    const logFilePath = getLogFilePath();
    const logDir = path.dirname(logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Check log file size for rotation
    if (fs.existsSync(logFilePath)) {
      const stat = fs.statSync(logFilePath);
      if (stat.size >= MAX_LOG_SIZE) {
        rotateLogs(logFilePath);
      }
    }
    
    fs.appendFileSync(logFilePath, logText, 'utf8');
  } catch (e) {
    console.error('Failed to write to log file:', e);
  }
}

const logger = {
  info: (msg) => writeLog('INFO', msg),
  warn: (msg) => writeLog('WARN', msg),
  error: (msg, err) => writeLog('ERROR', msg, err),
  critical: (msg, err) => writeLog('CRITICAL', msg, err),
  getLogPath: () => getLogFilePath()
};

module.exports = logger;
