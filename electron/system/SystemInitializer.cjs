const fs = require('fs');
const path = require('path');
const logger = require('../logger.cjs');
const { getStorageDirectory } = require('../paths.cjs');
const StartupValidator = require('./StartupValidator.cjs');

class SystemInitializer {
  /**
   * First-run setup of this computer, reported to the init screen in 5 steps.
   * Accounts and data live in the cloud database, so nothing is created locally besides
   * folders and configuration; the server creates the first administrator itself.
   */
  static async initializeSystem(baseDir = null, progressCb = null) {
    const storageDir = baseDir || getStorageDirectory();
    logger.info('[Startup] Starting Himmel Pharmaceutical System Initialization...');

    const reportProgress = (stepIndex, text, isDone = false) => {
      logger.info(`[Startup] Init Step [${stepIndex}/5]: ${text} ${isDone ? '(Done)' : '(Starting)'}`);
      if (typeof progressCb === 'function') {
        try {
          progressCb({ step: stepIndex, text, done: isDone });
        } catch (e) {
          logger.error('[Startup] Failed to invoke progress callback:', e);
        }
      }
    };

    try {
      // Step 1: Creating folders
      reportProgress(1, 'Creating folders', false);
      StartupValidator.getRequiredFolders(storageDir).forEach(f => {
        if (!fs.existsSync(f.path)) {
          fs.mkdirSync(f.path, { recursive: true });
          logger.info(`[Startup] Created folder: ${f.name} at ${f.path}`);
        }
      });
      reportProgress(1, 'Creating folders', true);

      // Step 2: Connecting to the cloud database
      reportProgress(2, 'Connecting to cloud server', false);
      const cloud = require('../cloud/CloudClient.cjs');
      const health = await cloud.checkHealth();
      if (!health.reachable) {
        throw new Error(`Cannot reach the cloud server at ${cloud.getApiUrl()}. Please check your internet connection.`);
      }
      reportProgress(2, 'Connecting to cloud server', true);

      // Step 3: Loading configuration
      reportProgress(3, 'Loading configuration', false);
      const configFile = StartupValidator.getConfigFile(storageDir);
      if (!fs.existsSync(configFile)) {
        fs.mkdirSync(path.dirname(configFile), { recursive: true });
        fs.writeFileSync(configFile, JSON.stringify({
          appName: 'Himmel Pharmaceutical',
          version: '1.0.1',
          storageDirectory: storageDir,
          theme: 'light',
          autoBackupEnabled: true,
          initializedAt: new Date().toISOString()
        }, null, 2), 'utf-8');
        logger.info(`[Startup] Created default configuration file at ${configFile}`);
      }
      reportProgress(3, 'Loading configuration', true);

      // Step 4: Accounts are managed on the cloud server
      reportProgress(4, 'Checking user accounts', false);
      reportProgress(4, 'Checking user accounts', true);

      // Step 5: Finalizing setup
      reportProgress(5, 'Finalizing setup', false);
      logger.info('[Startup] Initialization Complete');
      reportProgress(5, 'Finalizing setup', true);

      if (typeof progressCb === 'function') {
        try {
          progressCb({ step: 6, text: 'System Ready', done: true, complete: true });
        } catch (e) {}
      }

      return { success: true };
    } catch (err) {
      logger.error('[Startup] CRITICAL: System Initialization Failed:', err);
      throw err;
    }
  }
}

module.exports = SystemInitializer;
