const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function getLogFilePath() {
  try {
    return path.join(app.getPath('userData'), 'app.log');
  } catch (e) {
    return path.join(process.cwd(), 'app-fallback.log');
  }
}

function writeLog(level, message, error) {
  const timestamp = new Date().toISOString();
  let logText = `[${timestamp}] [${level}] ${message}\n`;
  if (error) {
    logText += `${error.stack || error.message || error}\n`;
  }
  
  try {
    const logFilePath = getLogFilePath();
    const logDir = path.dirname(logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
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
  getLogPath: () => getLogFilePath()
};

module.exports = logger;
