const { app } = require('electron');

// %APPDATA%\Himmel Pharmaceutical (set in main.cjs). Holds logs, exports and backup files.
function getStorageDirectory() {
  try {
    return app.getPath('userData');
  } catch (e) {
    return process.cwd();
  }
}

module.exports = { getStorageDirectory };
