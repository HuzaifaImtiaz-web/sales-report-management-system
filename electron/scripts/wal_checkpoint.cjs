/**
 * WAL Checkpoint + Cleanup leftover temp tables
 */
const {app}=require('electron');
app.setName('Himmel Pharmaceutical');
const path=require('path');
app.setPath('userData',path.join(app.getPath('appData'),'Himmel Pharmaceutical'));

app.whenReady().then(()=>{
  const Database=require('better-sqlite3');
  const dbPath=path.join(app.getPath('userData'),'database','admin.db');
  const log=(m)=>console.log(m);

  log('DB: '+dbPath);
  const db=new Database(dbPath);

  // Force WAL checkpoint to merge WAL into main DB
  try {
    const r = db.pragma('wal_checkpoint(TRUNCATE)');
    log('WAL checkpoint: '+JSON.stringify(r));
  } catch(e) { log('WAL checkpoint error: '+e.message); }

  // Drop any leftover temp tables from failed migrations
  const temps = ['areas_temp','doctors_temp','institutions_temp','team_members_temp','groups_temp','products_temp'];
  for (const t of temps) {
    try {
      db.exec(`DROP TABLE IF EXISTS ${t};`);
      log('Dropped (if existed): '+t);
    } catch(e) { log('Could not drop '+t+': '+e.message); }
  }

  // Verify groups schema is clean
  const groupCols = db.prepare('PRAGMA table_info(groups)').all();
  const divCol = groupCols.find(c=>c.name==='division_id');
  log('groups.division_id notnull: '+(divCol?divCol.notnull:'NOT FOUND'));

  // Run another WAL checkpoint to commit our drops
  try {
    const r2 = db.pragma('wal_checkpoint(TRUNCATE)');
    log('Final WAL checkpoint: '+JSON.stringify(r2));
  } catch(e) { log('Final WAL checkpoint error: '+e.message); }

  db.close();
  log('Done.');
  app.quit();
});
