const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const cloud = require('./CloudClient.cjs');
const { isSqliteFile, readLegacyBackup } = require('./legacyBackup.cjs');
const { getStorageDirectory } = require('../paths.cjs');
const logger = require('../logger.cjs');

const BACKUP_TIMEOUT_MS = 5 * 60 * 1000;
const RESTORE_TIMEOUT_MS = 10 * 60 * 1000;

function getBackupDirectory() {
  const dir = path.join(getStorageDirectory(), 'Backups');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function timestamp(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}_${pad(now.getMonth() + 1)}_${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
}

/**
 * Downloads a full copy of the shared cloud database and saves it on this computer
 * (an extra, offline copy next to the cloud provider's own backups).
 */
async function createBackup() {
  const username = cloud.getCurrentUsername().replace(/[^a-zA-Z0-9_-]/g, '_');
  const snapshot = await cloud.request('backup:export', [], { timeoutMs: BACKUP_TIMEOUT_MS });

  const now = new Date();
  const fileName = `backup_${username}_${timestamp(now)}.json`;
  const filePath = path.join(getBackupDirectory(), fileName);
  const tempPath = `${filePath}.tmp`;

  fs.writeFileSync(tempPath, JSON.stringify(snapshot), 'utf8');
  // Verify the file reads back before keeping it.
  JSON.parse(fs.readFileSync(tempPath, 'utf8'));
  fs.renameSync(tempPath, filePath);

  logger.info(`Cloud database backup saved: ${filePath}`);
  return { success: true, fileName, path: filePath, time: now.toISOString() };
}

/**
 * Replaces the data in the cloud database with a backup file: a .json backup from this version,
 * or a .db backup from the old local version. Affects every user, so the app restarts afterwards.
 */
async function restoreBackup(backupPath) {
  if (!backupPath || !fs.existsSync(backupPath)) {
    throw new Error('Backup file does not exist.');
  }

  let snapshot;
  if (isSqliteFile(backupPath)) {
    snapshot = readLegacyBackup(backupPath);
  } else {
    try {
      snapshot = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    } catch (e) {
      throw new Error('Invalid Backup File: the file is not a Himmel backup.');
    }
  }

  logger.info(`Restoring cloud database from ${backupPath}`);
  await cloud.request('backup:restore', [snapshot, { fileName: path.basename(backupPath) }], { timeoutMs: RESTORE_TIMEOUT_MS });

  // Same as before: sign out and restart so every screen reloads the restored data.
  cloud.clearSession();
  setTimeout(() => {
    app.relaunch();
    app.exit(0);
  }, 1000);
  return true;
}

function getBackupHistory() {
  const backupDir = path.join(getStorageDirectory(), 'Backups');
  if (!fs.existsSync(backupDir)) return [];

  return fs.readdirSync(backupDir)
    .filter((f) => f.startsWith('backup_') && (f.endsWith('.json') || f.endsWith('.db')))
    .map((file) => {
      const filePath = path.join(backupDir, file);
      const stat = fs.statSync(filePath);
      return { fileName: file, filePath, sizeBytes: stat.size, modifiedAt: stat.mtime.toISOString() };
    })
    .sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
}

/**
 * Scheduled backup (Settings > Backup schedule). Runs on an administrator's computer only,
 * because downloading the whole database is an administrator action.
 */
async function checkAndRunAutoBackup() {
  const session = cloud.getSession();
  if (!session || session.user.role !== 'Admin') return;

  try {
    const scheduleRow = await cloud.request('settings:getByKey', ['backup_schedule']);
    const lastBackupRow = await cloud.request('settings:getByKey', ['last_backup_time']);
    const schedule = scheduleRow ? scheduleRow.value : 'daily';
    if (schedule === 'none') return;

    const days = { daily: 1, weekly: 7, monthly: 30 }[schedule] || 1;
    const lastBackup = lastBackupRow ? new Date(lastBackupRow.value) : null;
    const due = !lastBackup || isNaN(lastBackup) || (Date.now() - lastBackup.getTime()) / 86400000 >= days;
    if (!due) return;

    logger.info(`Running automatic scheduled backup (${schedule})...`);
    const res = await createBackup();
    await cloud.request('settings:save', ['last_backup_time', res.time, 'general']);
  } catch (err) {
    logger.error('Automatic backup check failed:', err);
  }
}

module.exports = { createBackup, restoreBackup, getBackupHistory, checkAndRunAutoBackup, getBackupDirectory };
